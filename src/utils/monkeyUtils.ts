import { message } from "antd";
import {
  GM_openInTab,
  GM_setValue,
  GM_getValue,
  GM_deleteValue,
  GM_registerMenuCommand,
  GM_addValueChangeListener,
} from "vite-plugin-monkey/dist/client";
import type { StorageData } from "./storageUtils";
import { writeStorageToCurrentPage } from "./storageUtils";
/**
 * 自动同步存储数据的配置接口
 */
export interface AutoSyncInfo {
  timestamp: number;
  hasData: boolean;
  saveSessionStorage: boolean;
  saveLocalStorage: boolean;
}
export const checkAndAutoSyncStorage = (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // 获取并清除同步标记
      let syncInfo: AutoSyncInfo | null = null;

      // 首先尝试使用GM_getValue获取同步标记（跨域名可用）
      try {
        syncInfo = GM_getValue("__storage_sync_needed");
        if (syncInfo) {
          GM_deleteValue("__storage_sync_needed");
        }
      } catch (gmError) {
        // 降级到localStorage
        try {
          const syncInfoStr = localStorage.getItem("__storage_sync_needed");
          if (syncInfoStr) {
            try {
              syncInfo = JSON.parse(syncInfoStr);
              localStorage.removeItem("__storage_sync_needed");
            } catch (parseError) {
              syncInfo = null;
            }
          }
        } catch (storageError) {
          // 静默失败，继续执行
        }
      }

      // 验证同步信息
      if (!syncInfo || !syncInfo.hasData) {
        resolve(false);
        return;
      }

      // 检查同步请求是否过期（超过5分钟）
      if (Date.now() - syncInfo.timestamp > 5 * 60 * 1000) {
        resolve(false);
        return;
      }

      // 获取并应用保存的数据
      try {
        const storageData = getSavedStorageData();
        const result = writeStorageToCurrentPage(
          storageData,
          syncInfo.saveSessionStorage,
          syncInfo.saveLocalStorage
        );

        if (result.success) {
          // 数据写入成功后设置刷新标记并刷新页面
          try {
            sessionStorage.setItem("__storage_data_written_need_refresh", "true");
            setTimeout(() => window.location.reload(), 100);
          } catch (refreshError) {
            // 静默失败，继续返回成功
          }
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (applyError) {
        resolve(false);
      }
    } catch (error) {
      resolve(false);
    }
  });
};

/**
 * 使用油猴API保存存储数据
 */
export const saveStorageDataWithMonkey = (storageData: StorageData): void => {
  const sessionCount = Object.keys(storageData.sessionStorage).length;
  const localCount = Object.keys(storageData.localStorage).length;

  if (sessionCount === 0 && localCount === 0) {
    message.warning("没有选中或获取到任何存储数据");
    throw new Error("No storage data to save");
  }

  // 使用油猴API存储数据
  try {
    GM_setValue("tempStorageData", storageData);
    message.success(`成功保存 ${sessionCount + localCount} 条存储数据`);
  } catch (error) {
    message.error("存储数据失败，尝试使用localStorage");
    // 降级方案：使用localStorage
    try {
      localStorage.setItem("tempStorageData", JSON.stringify(storageData));
      message.success(
        `成功使用localStorage保存 ${sessionCount + localCount} 条存储数据`
      );
    } catch (localError) {
      message.error("所有存储方法都失败了");
      throw localError;
    }
  }
};

/**
 * 获取保存的存储数据
 */
export const getSavedStorageData = (): StorageData => {
  const defaultData: StorageData = {
    sessionStorage: {},
    localStorage: {},
  };

  try {
    // 首先尝试使用油猴API获取数据
    return GM_getValue("tempStorageData", defaultData);
  } catch (error) {
    message.warning("尝试从localStorage获取数据");
    // 降级方案：使用localStorage
    try {
      const tempData = localStorage.getItem("tempStorageData");
      if (tempData) {
        return JSON.parse(tempData);
      }
      return defaultData;
    } catch (localError) {
      message.error("无法获取存储的数据");
      throw localError;
    }
  }
};

/**
 * 打开目标网站
 */
export const openTargetWebsite = (url: string): boolean => {
  if (!url || !url.trim()) {
    message.error("请输入有效的目标网站地址");
    return false;
  }

  // 确保URL格式正确
  let targetUrlToOpen = url.trim();
  if (
    !targetUrlToOpen.startsWith("http://") &&
    !targetUrlToOpen.startsWith("https://")
  ) {
    targetUrlToOpen = "http://" + targetUrlToOpen;
  }

  try {
    // 验证URL格式
    new URL(targetUrlToOpen);
  } catch (error) {
    message.error("无效的URL格式");
    return false;
  }

  // 使用油猴API打开新标签页
  try {
    GM_openInTab(targetUrlToOpen, { active: true });
    message.info(`已打开目标网站: ${targetUrlToOpen}`);
    return true;
  } catch (error) {
    message.error("无法打开标签页，尝试使用window.open");
    // 降级方案：使用window.open
    const newTab = window.open(targetUrlToOpen, "_blank");
    if (!newTab) {
      message.error("无法打开新窗口，请检查浏览器弹窗设置");
      return false;
    }
    return true;
  }
};

/**
 * 清理临时存储数据
 */
export const cleanupTempStorage = (): void => {
  try {
    GM_deleteValue("tempStorageData");
    localStorage.removeItem("tempStorageData");
  } catch (e) {}
};

/**
 * 注册油猴菜单命令
 */
export const registerMonkeyMenuCommands = (
  showStorageInfo: () => void,
  saveStorageData: () => void,
  writeStorageToPage: () => void
): void => {
  try {
    // 注册油猴菜单命令
    GM_registerMenuCommand("显示当前页面存储信息", showStorageInfo);
    GM_registerMenuCommand("保存当前页面存储数据", () => {
      try {
        saveStorageData();
      } catch (error) {}
    });
    GM_registerMenuCommand("将保存的数据写入当前页面", writeStorageToPage);
  } catch (error) {
    // 静默失败，不影响核心功能
  }
};

/**
 * 设置存储数据变化监听器
 */
export const setupStorageChangeListener = (): void => {
  try {
    // 设置存储数据变化监听器
    GM_addValueChangeListener("tempStorageData", (name, oldValue, newValue, remote) => {
      if (remote) {
        message.info("检测到新的存储数据可用");
      }
    });
  } catch (error) {
    // 静默失败，不影响核心功能
  }
};
