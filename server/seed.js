/**
 * Seed script — populates Firestore with demo data.
 * Run with: node seed.js
 *
 * NOTE: This creates Firebase Auth users via Admin SDK and Firestore docs.
 * You can login with these demo accounts after seeding.
 */

const { admin, db, auth } = require('./firebase');

const DEMO_USERS = [
  { email: 'admin@nova.dev', password: 'password123', name: 'Alex Johnson', role: 'admin', avatarColor: '#6366f1' },
  { email: 'sarah@nova.dev', password: 'password123', name: 'Sarah Chen', role: 'member', avatarColor: '#ec4899' },
  { email: 'mike@nova.dev', password: 'password123', name: 'Mike Rivera', role: 'member', avatarColor: '#06b6d4' },
];

const DEMO_PROJECTS = [
  {
    name: 'Website Redesign',
    description: 'Complete overhaul of the company website with modern UI/UX, responsive design, and improved performance.',
    status: 'active',
    priority: 'high',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    name: 'Mobile App MVP',
    description: 'Build the first version of the mobile application for iOS and Android platforms.',
    status: 'planning',
    priority: 'high',
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    name: 'API Integration Suite',
    description: 'Integrate third-party APIs including payment, analytics, and notification services.',
    status: 'active',
    priority: 'medium',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEMO_TASKS = {
  0: [ // Website Redesign tasks
    { title: 'Design new homepage mockup', status: 'done', priority: 'high', assigneeIdx: 1 },
    { title: 'Implement responsive navigation', status: 'done', priority: 'high', assigneeIdx: 0 },
    { title: 'Build hero section component', status: 'in-progress', priority: 'medium', assigneeIdx: 1 },
    { title: 'Create footer with sitemap', status: 'in-progress', priority: 'low', assigneeIdx: 2 },
    { title: 'Optimize images and assets', status: 'todo', priority: 'medium', assigneeIdx: 0 },
    { title: 'Set up CI/CD pipeline', status: 'todo', priority: 'high', assigneeIdx: 0 },
  ],
  1: [ // Mobile App tasks
    { title: 'Set up React Native project', status: 'done', priority: 'high', assigneeIdx: 0 },
    { title: 'Design login/signup screens', status: 'in-progress', priority: 'high', assigneeIdx: 1 },
    { title: 'Build navigation structure', status: 'todo', priority: 'medium', assigneeIdx: 0 },
    { title: 'Implement push notifications', status: 'todo', priority: 'low', assigneeIdx: 2 },
  ],
  2: [ // API Integration tasks
    { title: 'Stripe payment integration', status: 'in-progress', priority: 'high', assigneeIdx: 0 },
    { title: 'Google Analytics setup', status: 'done', priority: 'medium', assigneeIdx: 2 },
    { title: 'SendGrid email service', status: 'todo', priority: 'medium', assigneeIdx: 1 },
    { title: 'Firebase push notifications', status: 'todo', priority: 'low', assigneeIdx: 2 },
  ],
};

async function seed() {
  console.log('🌱 Seeding NOVA demo data...\n');

  // Create users
  const userIds = [];
  for (const user of DEMO_USERS) {
    try {
      // Try to create Firebase Auth user
      let userRecord;
      try {
        userRecord = await auth.createUser({
          email: user.email,
          password: user.password,
          displayName: user.name,
        });
      } catch (err) {
        if (err.code === 'auth/email-already-exists') {
          userRecord = await auth.getUserByEmail(user.email);
          console.log(`  ⚡ User ${user.email} already exists, reusing.`);
        } else {
          throw err;
        }
      }

      // Create Firestore user doc
      await db.collection('users').doc(userRecord.uid).set({
        name: user.name,
        email: user.email,
        role: user.role,
        avatarColor: user.avatarColor,
        createdAt: new Date().toISOString(),
      });

      userIds.push(userRecord.uid);
      console.log(`  ✅ User: ${user.name} (${user.email})`);
    } catch (err) {
      console.error(`  ❌ Failed to create user ${user.email}:`, err.message);
      return;
    }
  }

  // Create projects
  const projectIds = [];
  for (let i = 0; i < DEMO_PROJECTS.length; i++) {
    const project = DEMO_PROJECTS[i];
    const docRef = await db.collection('projects').add({
      ...project,
      ownerId: userIds[0],
      memberIds: userIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    projectIds.push(docRef.id);
    console.log(`  ✅ Project: ${project.name}`);
  }

  // Create tasks
  for (const [projIdx, tasks] of Object.entries(DEMO_TASKS)) {
    for (const task of tasks) {
      await db.collection('projects').doc(projectIds[projIdx]).collection('tasks').add({
        title: task.title,
        description: '',
        status: task.status,
        priority: task.priority,
        assigneeId: userIds[task.assigneeIdx],
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    console.log(`  ✅ ${tasks.length} tasks for "${DEMO_PROJECTS[projIdx].name}"`);
  }

  // Create some activities
  const actions = [
    { action: 'created_project', details: 'Created project "Website Redesign"' },
    { action: 'created_task', details: 'Created task "Design new homepage mockup"' },
    { action: 'updated_task_status', details: 'Moved "Design new homepage mockup" to Done' },
    { action: 'added_member', details: 'Added Sarah Chen to the project' },
    { action: 'created_project', details: 'Created project "Mobile App MVP"' },
  ];

  for (let i = 0; i < actions.length; i++) {
    await db.collection('activities').add({
      projectId: projectIds[i % projectIds.length],
      userId: userIds[i % userIds.length],
      ...actions[i],
      createdAt: new Date(Date.now() - (actions.length - i) * 3600000).toISOString(),
    });
  }
  console.log(`  ✅ ${actions.length} activity entries`);

  console.log('\n✨ Seed complete! Demo accounts:');
  DEMO_USERS.forEach(u => console.log(`   ${u.email} / ${u.password}`));
  console.log('');
}

seed().catch(console.error);
