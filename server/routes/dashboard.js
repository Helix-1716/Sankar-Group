const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

// GET /api/dashboard/stats — aggregate stats
router.get('/stats', async (req, res) => {
  try {
    const projectsSnap = await db.collection('projects').get();
    const usersSnap = await db.collection('users').get();

    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let todoTasks = 0;
    let highPriorityTasks = 0;

    for (const projDoc of projectsSnap.docs) {
      const tasksSnap = await db.collection('projects').doc(projDoc.id)
        .collection('tasks').get();

      tasksSnap.docs.forEach(taskDoc => {
        const task = taskDoc.data();
        totalTasks++;
        if (task.status === 'done') completedTasks++;
        else if (task.status === 'in-progress') inProgressTasks++;
        else todoTasks++;
        if (task.priority === 'high') highPriorityTasks++;
      });
    }

    const completionRate = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    res.json({
      totalProjects: projectsSnap.size,
      totalTasks,
      totalMembers: usersSnap.size,
      completedTasks,
      inProgressTasks,
      todoTasks,
      highPriorityTasks,
      completionRate,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/dashboard/activity — recent activity
router.get('/activity', async (req, res) => {
  try {
    const snapshot = await db.collection('activities')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const activities = [];

    for (const doc of snapshot.docs) {
      const activity = { id: doc.id, ...doc.data() };

      // Enrich with user info
      const userDoc = await db.collection('users').doc(activity.userId).get();
      if (userDoc.exists) {
        activity.userName = userDoc.data().name;
        activity.userAvatarColor = userDoc.data().avatarColor;
      }

      activities.push(activity);
    }

    res.json(activities);
  } catch (err) {
    console.error('Dashboard activity error:', err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

module.exports = router;
