import { Helmet } from 'react-helmet';
import Nav from '../components/Nav';
import { DateTime } from 'luxon';
import { useState, useEffect } from 'react';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  preset?: boolean; 
  category?: string;
  icon?: string;
  hasTimer?: boolean;
  hasSpecialTimer?: boolean;
}

interface TimeWindow {
  start: number;  // hours in decimal
  end: number;
  type: 'cheese' | 'cleanup';
}

// Helper functions for Post Office timing
const POST_OFFICE_TIMES = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(hour => ({
  start: hour,
  end: hour + 0.333333 // 20 minutes = 1/3 hour
}));

const getPostOfficeStatus = (kstTime: DateTime) => {
  const hour = kstTime.hour + (kstTime.minute / 60);
  
  // Check if we're in an active window
  const currentWindow = POST_OFFICE_TIMES.find(window => 
    hour >= window.start && hour < window.end
  );
  
  if (currentWindow) {
    const endTime = kstTime.startOf('day').plus({ hours: currentWindow.end });
    const remainingMinutes = endTime.diff(kstTime).as('minutes');
    return {
      active: true,
      remainingMinutes: Math.floor(remainingMinutes)
    };
  }
  
  // Find next window
  let nextWindow = POST_OFFICE_TIMES.find(window => window.start > hour);
  if (!nextWindow) {
    nextWindow = POST_OFFICE_TIMES[0];
  }
  
  let nextTime = kstTime.startOf('day').plus({ hours: nextWindow.start });
  if (hour > POST_OFFICE_TIMES[POST_OFFICE_TIMES.length - 1].start) {
    nextTime = nextTime.plus({ days: 1 });
  }
  
  return {
    active: false,
    nextTime
  };
};

const getWeekdaySchedule = (kstTime: DateTime): TimeWindow[] => {
  const dayOfWeek = kstTime.weekday;  // 1-7, where 1 is Monday
  
  // Monday, Wednesday, Friday (1, 3, 5) - Cheese Vault
  if ([1, 3, 5].includes(dayOfWeek)) {
    return [
      { start: 2, end: 4, type: 'cheese' },
      { start: 6, end: 8, type: 'cheese' },
      { start: 10, end: 12, type: 'cheese' },
      { start: 14, end: 16, type: 'cheese' },
      { start: 18, end: 20, type: 'cheese' },
      { start: 22, end: 24, type: 'cheese' },
    ];
  }
  
  // Tuesday, Thursday (2, 4) - Town Square Cleanup
  if ([2, 4].includes(dayOfWeek)) {
    return [
      { start: 0, end: 2, type: 'cleanup' },
      { start: 4, end: 6, type: 'cleanup' },
      { start: 8, end: 10, type: 'cleanup' },
      { start: 12, end: 14, type: 'cleanup' },
      { start: 16, end: 18, type: 'cleanup' },
      { start: 20, end: 22, type: 'cleanup' },
    ];
  }
  
  // Weekend schedule (6, 7 - Saturday, Sunday)
  if ([6, 7].includes(dayOfWeek)) {
    return [
      { start: 1, end: 3, type: 'cheese' },
      { start: 4, end: 6, type: 'cleanup' },
      { start: 7, end: 9, type: 'cheese' },
      { start: 10, end: 12, type: 'cleanup' },
      { start: 13, end: 15, type: 'cheese' },
      { start: 16, end: 18, type: 'cleanup' },
      { start: 19, end: 21, type: 'cheese' },
      { start: 22, end: 24, type: 'cleanup' },
    ];
  }
  
  return [];
};

const getTownSquareStatus = (kstTime: DateTime) => {
  const schedule = getWeekdaySchedule(kstTime);
  const hour = kstTime.hour + (kstTime.minute / 60);
  
  // Check if we're in an active window
  const currentWindow = schedule.find(window => 
    hour >= window.start && hour < window.end
  );
  
  if (currentWindow) {
    const endTime = kstTime.startOf('day').plus({ hours: currentWindow.end });
    const remainingMinutes = endTime.diff(kstTime).as('minutes');
    return {
      active: true,
      type: currentWindow.type,
      remainingMinutes: Math.floor(remainingMinutes)
    };
  }
  
  // Find next window
  let nextWindow = schedule.find(window => window.start > hour);
  if (!nextWindow) {
    // If no more windows today, get tomorrow's first window
    const tomorrowTime = kstTime.plus({ days: 1 });
    const tomorrowSchedule = getWeekdaySchedule(tomorrowTime);
    nextWindow = tomorrowSchedule[0];
    
    return {
      active: false,
      nextTime: tomorrowTime.startOf('day').plus({ hours: nextWindow.start }),
      type: nextWindow.type
    };
  }
  
  return {
    active: false,
    nextTime: kstTime.startOf('day').plus({ hours: nextWindow.start }),
    type: nextWindow.type
  };
};

const PRESET_TODOS: TodoItem[] = [
  // Advertisement category
  { id: 'preset-5', text: 'Tree of Wishes', completed: false, preset: true },
  {
    id: 'preset-11',
    text: 'Daily Gifts',
    completed: false,
    preset: true,
    category: 'Quick Tasks'
  },
  {
    id: 'preset-12',
    text: 'Shop',
    completed: false,
    preset: true,
    category: 'Quick Tasks'
  },
  {
    id: 'preset-13',
    text: 'Guild Check-In',
    completed: false,
    preset: true,
    category: 'Quick Tasks'
  },
  { id: 'preset-1', text: 'Letter Ads x 5', completed: false, preset: true, category: 'Advertisements' },
  { id: 'preset-2', text: 'Time Skip Ads x 5', completed: false, preset: true, category: 'Advertisements' },
  { id: 'preset-3', text: 'Free Gift Ads x 1', completed: false, preset: true, category: 'Advertisements' },
  // Alliance
    { 
    id: 'preset-6', 
    text: 'Bounties', 
    completed: false, 
    preset: true,
    icon: '/assets/dailies/bounties.png'
  },
  { 
    id: 'preset-7', 
    text: 'Trade Ships x 2', 
    completed: false, 
    preset: true,
    icon: '/assets/dailies/touc.png'
  },

  
  // Cuckoo Town Square category
  { 
    id: 'preset-8', 
    text: 'Town Square - Post Office Reward', 
    completed: false, 
    preset: true,
    hasTimer: true,
    category: 'Town Square - Daily Quests',
    icon: '/assets/dailies/post-office.png'
  },
  { 
    id: 'preset-9', 
    text: 'Town Square Events', 
    completed: false, 
    preset: true,
    hasSpecialTimer: true,
    category: 'Town Square - Daily Quests'
  },
   {
    id: 'preset-4', 
    text: 'Alliance x 2', 
    completed: false, 
    preset: true,
    icon: '/assets/dailies/alliance.png'
  },
  {
    id: 'preset-10',
    text: 'Town Square - Time Rewards',
    completed: false,
    preset: true,
  },
];

const Dailies = () => {
  const [currentTime, setCurrentTime] = useState({
    ist: DateTime.now().setZone('Asia/Kolkata'),
    kst: DateTime.now().setZone('Asia/Seoul')
  });

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const savedTodos = localStorage.getItem('dailyTodos');
    const savedData = savedTodos ? JSON.parse(savedTodos) : { custom: [], presetStates: {}, lastResetDate: '' };
    
    // Get the current KST date
    const currentKstDate = DateTime.now().setZone('Asia/Seoul').startOf('day');
    const lastResetDate = savedData.lastResetDate 
      ? DateTime.fromISO(savedData.lastResetDate).setZone('Asia/Seoul').startOf('day')
      : currentKstDate;

    // If the saved data is from a previous day, reset all completed states
    if (!currentKstDate.equals(lastResetDate)) {
      return PRESET_TODOS.map(preset => ({
        ...preset,
        completed: false
      }));
    }
    
    // Otherwise, load saved states
    const presetStates = savedData.presetStates || {};
    const presetsWithState = PRESET_TODOS.map(preset => ({
      ...preset,
      completed: presetStates[preset.id] || false
    }));
    
    return [...presetsWithState, ...(savedData.custom || [])];
  });

  const [collapsedCategories, setCollapsedCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('dailyCollapsedCategories');
    return saved ? JSON.parse(saved) : [];
  });

  // Simple timer just for display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime({
        ist: DateTime.now().setZone('Asia/Kolkata'),
        kst: DateTime.now().setZone('Asia/Seoul')
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('dailyTodos', JSON.stringify({
      custom: todos.filter(todo => !todo.preset),
      presetStates: todos
        .filter(todo => todo.preset)
        .reduce((acc, todo) => ({
          ...acc,
          [todo.id]: todo.completed
        }), {}),
      lastResetDate: DateTime.now().setZone('Asia/Seoul').startOf('day').toISO()
    }));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('dailyCollapsedCategories', JSON.stringify(collapsedCategories));
  }, [collapsedCategories]);

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const removeTodo = (id: string) => {
    const todoToRemove = todos.find(todo => todo.id === id);
    if (todoToRemove?.preset) return;
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const toggleCategory = (category: string) => {
    const categoryTodos = todos.filter(todo => todo.category === category);
    const allCompleted = categoryTodos.every(todo => todo.completed);
    
    setTodos(todos.map(todo => 
      todo.category === category ? { ...todo, completed: !allCompleted } : todo
    ));

    if (!allCompleted) {
      setCollapsedCategories([...collapsedCategories, category]);
    } else {
      setCollapsedCategories(collapsedCategories.filter(c => c !== category));
    }
  };

  const isCategoryCompleted = (category: string) => {
    const categoryTodos = todos.filter(todo => todo.category === category);
    return categoryTodos.length > 0 && categoryTodos.every(todo => todo.completed);
  };

  const renderTodoText = (todo: TodoItem) => {
    if (!todo.hasTimer && !todo.hasSpecialTimer || todo.completed) {
      return todo.text;
    }

    if (todo.hasTimer) {
      const status = getPostOfficeStatus(currentTime.kst);
      
      if (status.active) {
        return (
          <span className="flex items-center gap-2">
            {todo.text}
            <span className="text-green-400 text-sm">
              ({status.remainingMinutes}m remaining)
            </span>
          </span>
        );
      }

      const kstNext = status.nextTime;
      const istNext = status.nextTime?.setZone('Asia/Kolkata');
      const duration = kstNext?.diff(currentTime.kst);
      const hours = Math.floor(duration?.as('hours') ?? 0);
      const minutes = Math.floor((duration?.as('minutes') ?? 0) % 60);

      return (
        <span className="flex flex-col">
          <span>{todo.text}</span>
          <span className="text-sm text-slate-400">
            Next: {hours}h {minutes}m
            <br />
            KST: {kstNext?.toFormat('HH:mm')} / 
            IST: {istNext?.toFormat('HH:mm')}
          </span>
        </span>
      );
    }

    if (todo.hasSpecialTimer) {
      const status = getTownSquareStatus(currentTime.kst);
      
      if (status.active) {
        const eventName = status.type === 'cheese' ? 'Cheese Vault' : 'Town Square Cleanup';
        return (
          <span className="flex items-center gap-2">
            {todo.text}
            <span className="text-green-400 text-sm">
              ({eventName}: {status.remainingMinutes}m remaining)
            </span>
          </span>
        );
      }

      const kstNext = status.nextTime;
      const istNext = status.nextTime?.setZone('Asia/Kolkata');
      const duration = kstNext?.diff(currentTime.kst);
      const hours = Math.floor(duration?.as('hours') ?? 0);
      const minutes = Math.floor((duration?.as('minutes') ?? 0) % 60);
      const nextEvent = status.type === 'cheese' ? 'Cheese Vault' : 'Town Square Cleanup';

      return (
        <span className="flex flex-col">
          <span>{todo.text}</span>
          <span className="text-sm text-slate-400">
            Next: {nextEvent} in {hours}h {minutes}m
            <br />
            KST: {kstNext?.toFormat('HH:mm')} / 
            IST: {istNext?.toFormat('HH:mm')}
          </span>
        </span>
      );
    }
  };

  const renderTodos = () => {
    // First, build a map of categories and their todos
    const seenCategories = new Set<string>();
    const renderedItems = new Set<string>();
    
    return (
      <div className="flex flex-col gap-4">
        {todos.map(todo => {
          // Skip if we've already rendered this item
          if (renderedItems.has(todo.id)) {
            return null;
          }

          if (todo.category) {
            // If this is the first time we're seeing this category
            if (!seenCategories.has(todo.category)) {
              seenCategories.add(todo.category);
              // Get all todos for this category
              const categoryTodos = todos.filter(t => t.category === todo.category);
              categoryTodos.forEach(t => renderedItems.add(t.id));

              return (
                <div key={todo.category} className="space-y-2">
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg group cursor-pointer select-none
                      ${todo.preset 
                        ? 'bg-slate-800/50 border border-slate-700' 
                        : 'bg-slate-800'
                      }
                      hover:bg-slate-700 transition-colors`}
                    onClick={() => toggleCategory(todo.category!)}
                  >
                    <input
                      type="checkbox"
                      checked={isCategoryCompleted(todo.category!)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleCategory(todo.category!);
                      }}
                      className="w-5 h-5 rounded border-slate-600 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-800 cursor-pointer"
                    />
                    <span className={`font-medium text-amber-100 flex-1
                      ${isCategoryCompleted(todo.category!) ? 'line-through text-slate-500' : ''}`}>
                      {todo.category}
                    </span>
                    <span 
                      className="material-icons text-amber-100 cursor-pointer p-1 rounded-lg
                        hover:bg-slate-600 active:bg-slate-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCollapsedCategories(
                          collapsedCategories.includes(todo.category!)
                            ? collapsedCategories.filter(c => c !== todo.category)
                            : [...collapsedCategories, todo.category!]
                        );
                      }}
                    >
                      {collapsedCategories.includes(todo.category!) ? 'expand_more' : 'expand_less'}
                    </span>
                  </div>

                  {!collapsedCategories.includes(todo.category!) && (
                    <div className="ml-4 space-y-2">
                      {categoryTodos.map(categoryTodo => (
                        <div
                          key={categoryTodo.id}
                          className={`flex items-center gap-2 p-3 rounded-lg group cursor-pointer select-none
                            ${categoryTodo.preset 
                              ? 'bg-slate-800/50 border border-slate-700' 
                              : 'bg-slate-800'
                            }
                            hover:bg-slate-700 transition-colors`}
                          onClick={() => toggleTodo(categoryTodo.id)}
                        >
                          <input
                            type="checkbox"
                            checked={categoryTodo.completed}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleTodo(categoryTodo.id);
                            }}
                            className="w-5 h-5 rounded border-slate-600 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-800 cursor-pointer"
                          />
                          <span className={`flex-1 flex items-center gap-2
                            ${categoryTodo.completed ? 'line-through text-slate-500' : ''}
                            ${categoryTodo.preset ? 'text-amber-100 font-medium' : ''}`}
                          >
                            {categoryTodo.icon && (
                              <img 
                                src={categoryTodo.icon} 
                                alt="" 
                                className="w-5 h-5 object-contain"
                              />
                            )}
                            {renderTodoText(categoryTodo)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          }

          // Render uncategorized todo
          renderedItems.add(todo.id);
          return (
            <div
              key={todo.id}
              className={`flex items-center gap-2 p-3 rounded-lg group cursor-pointer select-none
                ${todo.preset 
                  ? 'bg-slate-800/50 border border-slate-700' 
                  : 'bg-slate-800'
                }
                hover:bg-slate-700 transition-colors`}
              onClick={() => toggleTodo(todo.id)}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleTodo(todo.id);
                }}
                className="w-5 h-5 rounded border-slate-600 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-800 cursor-pointer"
              />
              <span className={`flex-1 flex items-center gap-2
                ${todo.completed ? 'line-through text-slate-500' : ''}
                ${todo.preset ? 'text-amber-100 font-medium' : ''}`}
              >
                {todo.icon && (
                  <img 
                    src={todo.icon} 
                    alt="" 
                    className="w-5 h-5 object-contain"
                  />
                )}
                {renderTodoText(todo)}
              </span>
              {!todo.preset && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTodo(todo.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                >
                  Delete
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Dailies</title>
      </Helmet>
      <div className="min-h-screen bg-slate-900 text-white font-sans">
        <Nav />
        <div className="flex flex-col w-full max-w-4xl mx-auto p-4">
          <div className="flex gap-4 items-center py-4 ">
            <h1 className="text-4xl font-semibold tracking-wide">Dailies</h1>
            <div className="flex gap-4 ml-auto text-sm">
              <div>
                <span className="text-slate-400">IST:</span>
                <span className="ml-2 font-mono text-cyan-400">
                  {currentTime.ist.toFormat('HH:mm:ss')}
                </span>
              </div>
              <div>
                <span className="text-slate-400">KST:</span>
                <span className="ml-2 font-mono text-cyan-400">
                  {currentTime.kst.toFormat('HH:mm:ss')}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-8">
            {renderTodos()}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dailies; 