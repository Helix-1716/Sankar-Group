const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

// GET /api/projects/:projectId/tasks — list tasks for a project
router.get('/projects/:projectId/tasks', async (req, res) => {
  try {
    const { status, priority, assigneeId, search } = req.query;

    let query = db.collection('projects').doc(req.params.projectId)
      .collection('tasks').orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    let tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Client-side filtering (Firestore doesn't support complex compound queries without indexes)
    if (status) tasks = tasks.filter(t => t.status === status);
    if (priority) tasks = tasks.filter(t => t.priority === priority);
    if (assigneeId) tasks = tasks.filter(t => t.assigneeId === assigneeId);
    if (search) {
      const s = search.toLowerCase();
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(s) ||
        (t.description && t.description.toLowerCase().includes(s))
      );
    }

    res.json(tasks);
  } catch (err) {
    console.error('List tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/projects/:projectId/tasks — create a task
router.post('/projects/:projectId/tasks', async (req, res) => {
  try {
    const { title, description, status, priority, assigneeId, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const task = {
      title,
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('projects').doc(req.params.projectId)
      .collection('tasks').add(task);

    // Log activity
    await db.collection('activities').add({
      projectId: req.params.projectId,
      userId: req.user.uid,
      action: 'created_task',
      details: `Created task "${title}"`,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ id: docRef.id, ...task });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:projectId/:taskId — update a task
router.put('/tasks/:projectId/:taskId', async (req, res) => {
  try {
    const { title, description, status, priority, assigneeId, dueDate } = req.body;
    const ref = db.collection('projects').doc(req.params.projectId)
      .collection('tasks').doc(req.params.taskId);

    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const oldData = doc.data();
    const updates = { updatedAt: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (assigneeId !== undefined) updates.assigneeId = assigneeId;
    if (dueDate !== undefined) updates.dueDate = dueDate;

    await ref.update(updates);

    // Log status change activity
    if (status && status !== oldData.status) {
      const statusLabels = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };
      await db.collection('activities').add({
        projectId: req.params.projectId,
        userId: req.user.uid,
        action: 'updated_task_status',
        details: `Moved "${oldData.title}" to ${statusLabels[status] || status}`,
        createdAt: new Date().toISOString(),
      });
    } else {
      await db.collection('activities').add({
        projectId: req.params.projectId,
        userId: req.user.uid,
        action: 'updated_task',
        details: `Updated task "${title || oldData.title}"`,
        createdAt: new Date().toISOString(),
      });
    }

    const updated = await ref.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:projectId/:taskId — delete a task
router.delete('/tasks/:projectId/:taskId', async (req, res) => {
  try {
    const ref = db.collection('projects').doc(req.params.projectId)
      .collection('tasks').doc(req.params.taskId);

    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const taskTitle = doc.data().title;
    await ref.delete();

    await db.collection('activities').add({
      projectId: req.params.projectId,
      userId: req.user.uid,
      action: 'deleted_task',
      details: `Deleted task "${taskTitle}"`,
      createdAt: new Date().toISOString(),
    });

    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
