import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [taskAnimations, setTaskAnimations] = useState({}); // For task animations

  // Load tasks from AsyncStorage on app start
  useEffect(() => {
    const loadTasksFromStorage = async () => {
      try {
        const savedTasks = await AsyncStorage.getItem('tasks');
        if (savedTasks) {
          setTasks(JSON.parse(savedTasks));
        }
      } catch (e) {
        console.error('Failed to load tasks from storage', e);
      }
    };
    loadTasksFromStorage();
  }, []);

  // Save tasks to AsyncStorage whenever they are updated
  useEffect(() => {
    const saveTasksToStorage = async () => {
      try {
        await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
      } catch (e) {
        console.error('Failed to save tasks to storage', e);
      }
    };
    saveTasksToStorage();
  }, [tasks]);

  // Add task with animation
  const addTask = () => {
    if (task.trim()) {
      const newTask = { id: Date.now().toString(), text: task, completed: false };
      setTasks((prevTasks) => [...prevTasks, newTask]);

      const newTaskAnimations = { ...taskAnimations };
      newTaskAnimations[newTask.id] = new Animated.Value(0); // Start with opacity 0
      setTaskAnimations(newTaskAnimations);

      // Animate task to full opacity and scale
      Animated.timing(newTaskAnimations[newTask.id], {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      setTask('');
    }
  };

  // Delete task with animation
  const deleteTask = (taskId) => {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex >= 0) {
      const newTaskAnimations = { ...taskAnimations };
      newTaskAnimations[taskId] = new Animated.Value(1); // Initialize animation for the task

      setTaskAnimations(newTaskAnimations);

      // Animate the task shrinking and fading out
      Animated.timing(newTaskAnimations[taskId], {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Once animation is done, remove the task from state
        setTasks((prevTasks) => prevTasks.filter((item) => item.id !== taskId));
        // Remove the animation state for the task after it's deleted
        const updatedTaskAnimations = { ...newTaskAnimations };
        delete updatedTaskAnimations[taskId];
        setTaskAnimations(updatedTaskAnimations);
      });
    }
  };

  // Toggle task completion status
  const toggleComplete = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Edit task text and keep editing mode
  const updateTask = (taskId, newText) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, text: newText } : task
      )
    );
  };

  // Handle blur (when user finishes editing)
  const handleBlur = () => {
    setEditingId(null); // Close editing mode when focus is lost
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple To-Do List</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task"
          value={task}
          onChangeText={(text) => setTask(text)}
        />
        <TouchableOpacity style={styles.addButton} onPress={addTask}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        renderItem={({ item }) => {
          const taskAnimation = taskAnimations[item.id] || new Animated.Value(1);

          const animationStyle = {
            opacity: taskAnimation,
            transform: [
              {
                scale: taskAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          };

          return (
            <Animated.View style={[styles.taskContainer, animationStyle]}>
              <TouchableOpacity onPress={() => toggleComplete(item.id)}>
                {editingId === item.id ? (
                  <TextInput
                    style={styles.input}
                    value={item.text}
                    onChangeText={(text) => updateTask(item.id, text)}
                    onBlur={handleBlur} // Keep editing open until user taps away
                    autoFocus // Automatically focus on the input when editing
                  />
                ) : (
                  <Text
                    style={[
                      styles.taskText,
                      item.completed && styles.completedTask,
                    ]}
                  >
                    {item.text}
                  </Text>
                )}
              </TouchableOpacity>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => setEditingId(item.id)}>
                  <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteTask(item.id)}>
                  <Text style={styles.deleteButton}>X</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          );
        }}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: '#5C5CFF',
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginLeft: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  taskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#333',
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: 'gray',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    color: '#FFA500',
    fontWeight: 'bold',
    fontSize: 14,
    marginHorizontal: 10,
  },
  deleteButton: {
    color: '#FF5C5C',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
