const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

// GET /api/projects — list all projects with task counts
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('projects').orderBy('createdAt', 'desc').get();
    const projects = [];

    for (const doc of snapshot.docs) {
      const project = { id: doc.id, ...doc.data() };

      // Get task counts
      const tasksSnap = await db.collection('projects').doc(doc.id).collection('tasks').get();
      const tasks = tasksSnap.docs.map(t => t.data());

      project.taskCount = tasks.length;
      project.completedTasks = tasks.filter(t => t.status === 'done').length;
      project.progress = tasks.length > 0
        ? Math.round((project.completedTasks / tasks.length) * 100)
        : 0;

      projects.push(project);
    }

    res.json(projects);
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects — create a new project
router.post('/', async (req, res) => {
  try {
    const { name, description, status, priority, deadline } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = {
      name,
      description: description || '',
      status: status || 'planning',
      priority: priority || 'medium',
      deadline: deadline || null,
      ownerId: req.user.uid,
      memberIds: [req.user.uid],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('projects').add(project);

    // Log activity
    await db.collection('activities').add({
      projectId: docRef.id,
      userId: req.user.uid,
      action: 'created_project',
      details: `Created project "${name}"`,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ id: docRef.id, ...project });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET /api/projects/:id — get single project with tasks and members
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('projects').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = { id: doc.id, ...doc.data() };

    // Get tasks
    const tasksSnap = await db.collection('projects').doc(doc.id)
      .collection('tasks').orderBy('createdAt', 'desc').get();
    project.tasks = tasksSnap.docs.map(t => ({ id: t.id, ...t.data() }));

    // Get member details
    const members = [];
    if (project.memberIds && project.memberIds.length > 0) {
      for (const uid of project.memberIds) {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
          members.push({ uid: userDoc.id, ...userDoc.data() });
        }
      }
    }
    project.members = members;

    // Compute progress
    project.taskCount = project.tasks.length;
    project.completedTasks = project.tasks.filter(t => t.status === 'done').length;
    project.progress = project.tasks.length > 0
      ? Math.round((project.completedTasks / project.tasks.length) * 100)
      : 0;

    res.json(project);
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// PUT /api/projects/:id — update project
router.put('/:id', async (req, res) => {
  try {
    const { name, description, status, priority, deadline } = req.body;
    const ref = db.collection('projects').doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updates = { updatedAt: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (deadline !== undefined) updates.deadline = deadline;

    await ref.update(updates);

    // Log activity
    await db.collection('activities').add({
      projectId: req.params.id,
      userId: req.user.uid,
      action: 'updated_project',
      details: `Updated project "${name || doc.data().name}"`,
      createdAt: new Date().toISOString(),
    });

    const updated = await ref.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id — delete project and cascade tasks
router.delete('/:id', async (req, res) => {
  try {
    const ref = db.collection('projects').doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete all tasks in subcollection
    const tasksSnap = await ref.collection('tasks').get();
    const batch = db.batch();
    tasksSnap.docs.forEach(taskDoc => batch.delete(taskDoc.ref));
    await batch.commit();

    // Delete project
    await ref.delete();

    // Log activity
    await db.collection('activities').add({
      projectId: req.params.id,
      userId: req.user.uid,
      action: 'deleted_project',
      details: `Deleted project "${doc.data().name}"`,
      createdAt: new Date().toISOString(),
    });

    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// POST /api/projects/:id/members — add member
router.post('/:id/members', async (req, res) => {
  try {
    const { userId } = req.body;
    const ref = db.collection('projects').doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const memberIds = doc.data().memberIds || [];
    if (memberIds.includes(userId)) {
      return res.status(400).json({ error: 'User already a member' });
    }

    memberIds.push(userId);
    await ref.update({ memberIds, updatedAt: new Date().toISOString() });

    // Log activity
    const userDoc = await db.collection('users').doc(userId).get();
    await db.collection('activities').add({
      projectId: req.params.id,
      userId: req.user.uid,
      action: 'added_member',
      details: `Added ${userDoc.exists ? userDoc.data().name : 'a member'} to the project`,
      createdAt: new Date().toISOString(),
    });

    res.json({ memberIds });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// DELETE /api/projects/:id/members/:userId — remove member
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const ref = db.collection('projects').doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const memberIds = (doc.data().memberIds || []).filter(id => id !== req.params.userId);
    await ref.update({ memberIds, updatedAt: new Date().toISOString() });

    res.json({ memberIds });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

module.exports = router;
