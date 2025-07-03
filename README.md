# 🏠 Home Productivity Suite

A comprehensive productivity ecosystem that helps you manage your home life, work tasks, habits, and focus sessions.

## 🎯 Applications

### 🧹 ChoresMaster
- **Recurring home tasks**: Set up daily, weekly, monthly chore schedules
- **Smart reminders**: Never forget important household tasks
- **Progress tracking**: Visual calendar view of completed and pending tasks
- **Family collaboration**: Share task lists with household members
- **Flexible scheduling**: Custom repeat patterns for different needs

### ✅ TaskMaster  
- **Project management**: Organize work and personal projects
- **Kanban boards**: Visual workflow with todo, in-progress, and done columns
- **Team collaboration**: Invite team members and assign tasks
- **Task details**: Rich descriptions, comments, priority levels
- **Due dates & notifications**: Stay on top of deadlines

### 🎯 HabitMaster
- **Habit tracking**: Build and maintain positive daily habits
- **Streak counting**: Visual progress with streak counters and analytics
- **Flexible scheduling**: Daily, weekly, monthly, or custom frequencies
- **Email reminders**: Configurable email notifications to stay consistent
- **Progress analytics**: Detailed insights into your habit performance
- **Data export/import**: Backup and restore your habit data

### 🍅 FocusMaster ✨ NEW!
- **Pomodoro Timer**: 25-minute focus sessions with customizable intervals
- **Task Integration**: Import tasks from TaskMaster or create focus-specific tasks
- **Distraction Logging**: Track what interrupts your focus to improve over time
- **Session Analytics**: Detailed statistics on focus time, completion rates, and streaks
- **Smart Breaks**: Automatic break suggestions between focus sessions
- **Motivational Quotes**: Daily inspiration to maintain focus

#### FocusMaster Features:
- ⏰ **Customizable Pomodoro Timer** (25/5/15 minute default intervals)
- 📋 **Task Queue Management** with priority sorting
- 🚨 **Distraction Tracking** with categorized logging
- 📊 **Focus Analytics** showing daily/weekly progress
- 🔔 **Smart Notifications** with browser and sound alerts
- 🎵 **Background Sounds** (coming soon)
- 📈 **Streak Tracking** for consecutive focus days
- ⚙️ **Customizable Settings** for timer lengths and preferences

## 🚀 Getting Started

1. **Clone the repository**
```bash
git clone <repository-url>
cd cho
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Firebase** (if not already configured)
- Create a Firebase project
- Add your configuration to `src/firebase.js`
- Enable Firestore Database
- Enable Authentication

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser** and navigate to the provided local URL

## 🏗️ Project Structure

```
src/
├── App.jsx                 # Main application and ChoresMaster
├── TaskMaster.jsx         # Project and task management
├── habit/                 # HabitMaster module
│   ├── HabitMaster.jsx
│   ├── components/
│   ├── constants/
│   ├── pages/
│   └── utils/
├── focus/                 # FocusMaster module ✨ NEW!
│   ├── FocusMaster.jsx
│   ├── components/
│   │   ├── FocusTimer.jsx
│   │   ├── TaskPicker.jsx
│   │   └── DistractionLogger.jsx
│   ├── constants/
│   │   └── focusConstants.js
│   ├── pages/
│   │   └── SettingsPage.jsx
│   └── utils/
│       ├── timerUtils.js
│       └── taskUtils.js
├── firebase.js            # Firebase configuration
└── AppRouter.jsx          # Application routing
```

## 🔧 Technology Stack

- **Frontend**: React 18 with Vite
- **UI Framework**: Material-UI (MUI)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Routing**: React Router
- **Calendar**: FullCalendar
- **Date Handling**: date-fns
- **Drag & Drop**: @dnd-kit (TaskMaster)

## 📱 Navigation

Each application is accessible through the main navigation:

- **🏠 Home**: `/` - ChoresMaster and main navigation
- **✅ TaskMaster**: `/taskmaster` - Project and task management
- **🎯 HabitMaster**: `/habitmaster` - Habit tracking and analytics  
- **🍅 FocusMaster**: `/focusmaster` - Pomodoro timer and focus sessions

## 🔮 Roadmap

### FocusMaster Enhancements
- [ ] Background soundscapes (white noise, rain, café ambience)
- [ ] Advanced session analytics and insights
- [ ] Custom break activities and breathing exercises
- [ ] Team collaboration and shared focus sessions
- [ ] Calendar integration for automatic task scheduling
- [ ] Website/app blocking during focus sessions
- [ ] AI-powered focus recommendations

### General Improvements
- [ ] Mobile app versions
- [ ] Offline functionality
- [ ] Advanced reporting across all modules
- [ ] Smart home integrations
- [ ] Voice commands and controls

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Happy Productivity!** 🚀✨
