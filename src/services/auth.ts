// Firebase Auth service for SmartVictus
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from './firebase';

// Регистрация по email/password
export const register = async (email: string, password: string): Promise<User> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
};

// Вход по email/password
export const login = async (email: string, password: string): Promise<User> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

// Выход из аккаунта
export const logout = async (): Promise<void> => {
  await signOut(auth);
};

// Сброс пароля
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

// Получить текущего пользователя
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Слушатель изменения состояния авторизации
export const subscribeAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export type { User };
