import { message } from "antd";

// 存储数据接口定义
export interface StorageData {
  sessionStorage: Record<string, string>;
  localStorage: Record<string, string>;
}

/**
 * 获取当前页面的所有 Session storage
 */
export const getAllSessionStorage = (): Record<string, string> => {
  const sessionData: Record<string, string> = {};
  try {
    // 遍历所有的 sessionStorage 键
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        sessionData[key] = sessionStorage.getItem(key) || "";
      }
    }
    return sessionData;
  } catch (error) {
    message.error("获取 Session storage 失败");
    return {};
  }
};

/**
 * 获取当前页面的所有 Local storage
 */
export const getAllLocalStorage = (): Record<string, string> => {
  const localData: Record<string, string> = {};
  try {
    // 遍历所有的 localStorage 键
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        localData[key] = localStorage.getItem(key) || "";
      }
    }
    return localData;
  } catch (error) {
    message.error("获取 Local storage 失败");
    return {};
  }
};

/**
 * 生成当前页面存储信息的文本
 */
export const generateStorageInfoText = (): string => {
  const sessionData = getAllSessionStorage();
  const localData = getAllLocalStorage();

  const sessionCount = Object.keys(sessionData).length;
  const localCount = Object.keys(localData).length;

  return (
    `当前页面存储信息：\n` +
    `Session Storage: ${sessionCount} 条记录\n` +
    `Local Storage: ${localCount} 条记录`
  );
};

// 定义写入结果接口
export interface WriteStorageResult {
  success: boolean;
  sessionCount: number;
  localCount: number;
  error?: string;
}

/**
 * 检查存储访问权限
 */
const checkStorageAccess = (storage: Storage): boolean => {
  try {
    const testKey = "__test_accessibility__";
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 写入存储数据到指定存储对象
 */
const writeToStorage = (
  storage: Storage,
  data: Record<string, string>,
  storageType: 'sessionStorage' | 'localStorage'
): { count: number; error?: string } => {
  let count = 0;
  let errorMessage: string | undefined;

  Object.entries(data).forEach(([key, value]) => {
    try {
      storage.setItem(key, value);
      // 验证写入是否成功
      const storedValue = storage.getItem(key);
      if (storedValue === value) {
        count++;
      } else {
        errorMessage = `${storageType}写入验证失败: ${key}`;
      }
    } catch (error) {
      errorMessage = `写入 ${storageType} 时出错: ${key}`;
    }
  });

  return { count, error: errorMessage };
};

/**
 * 将存储数据写入当前页面
 */
export const writeStorageToCurrentPage = (
  storageData: StorageData,
  saveSessionStorage: boolean,
  saveLocalStorage: boolean
): WriteStorageResult => {
  try {
    // 检查存储访问权限
    const sessionStorageAccessible = checkStorageAccess(sessionStorage);
    const localStorageAccessible = checkStorageAccess(localStorage);
    
    // 写入数据
    let sessionCount = 0;
    let localCount = 0;
    let errorMessage: string | undefined;
    
    // 写入Session Storage
    if (saveSessionStorage && Object.keys(storageData.sessionStorage).length > 0 && sessionStorageAccessible) {
      const sessionResult = writeToStorage(sessionStorage, storageData.sessionStorage, 'sessionStorage');
      sessionCount = sessionResult.count;
      if (sessionResult.error) errorMessage = sessionResult.error;
    }
    
    // 写入Local Storage
    if (saveLocalStorage && Object.keys(storageData.localStorage).length > 0 && localStorageAccessible) {
      const localResult = writeToStorage(localStorage, storageData.localStorage, 'localStorage');
      localCount = localResult.count;
      if (localResult.error) errorMessage = localResult.error;
    }
    
    // 构造返回结果
    const hasNoAccess = !sessionStorageAccessible && !localStorageAccessible;
    const hasWrittenData = sessionCount > 0 || localCount > 0;
    const hasError = !!errorMessage || hasNoAccess;
    
    if (!hasWrittenData) {
      return {
        success: !hasError,
        sessionCount: 0,
        localCount: 0,
        error: hasError ? (errorMessage || "存储访问受限") : "没有可写入的存储数据",
      };
    }
    
    return {
      success: !hasError,
      sessionCount,
      localCount,
      error: errorMessage,
    };
  } catch (error) {
    return {
      success: false,
      sessionCount: 0,
      localCount: 0,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
};
