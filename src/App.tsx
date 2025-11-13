import { checkAndAutoSyncStorage } from "./utils/monkeyUtils";

// 尽早执行自动同步检查
(function earliestSyncExecution() {
  try {
    // 检查并清除刷新标记，避免无限循环刷新
    const refreshFlag = sessionStorage.getItem("__storage_data_written_need_refresh");
    if (refreshFlag === "true") {
      sessionStorage.removeItem("__storage_data_written_need_refresh");
      return;
    }
    
    // 执行同步检查
    checkAndAutoSyncStorage();
  } catch (error) {
    // 静默失败，不影响页面加载
  }
})();
import React, { useEffect, useState } from "react";
import { message } from "antd";
import "./App.css";
import DraggableButton from "./components/DraggableButton";
import StoragePanel from "./components/StoragePanel";
import {
  generateStorageInfoText,
  getAllSessionStorage,
  getAllLocalStorage,
  writeStorageToCurrentPage,
} from "./utils/storageUtils";
import {
  saveStorageDataWithMonkey,
  getSavedStorageData,
  registerMonkeyMenuCommands,
  setupStorageChangeListener,
} from "./utils/monkeyUtils";

function App() {
  const [panelVisible, setPanelVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(true);
  const [saveSessionStorage, setSaveSessionStorage] = useState(true);
  const [saveLocalStorage, setSaveLocalStorage] = useState(true);
  const [buttonPosition, setButtonPosition] = useState({
    x: "calc(100% - 70px)", // 右侧底部，留出边距
    y: "calc(100% - 70px)",
  });

  // 处理悬浮按钮点击
  const handleButtonClick = () => {
    setPanelVisible(true);
    setButtonVisible(false);
  };

  // 处理面板关闭
  const handlePanelClose = () => {
    setPanelVisible(false);
    setButtonVisible(true);
  };

  const handlePositionChange = (position: { x: string; y: string }) => {
    setButtonPosition(position);
  };

  // 显示当前页面存储信息（用于油猴菜单）
  const showStorageInfoForMenu = () => {
    try {
      const infoText = generateStorageInfoText();
      message.info(infoText);
    } catch (error) {
      // 静默失败
    }
  };

  // 保存当前页面存储数据（用于油猴菜单）
  const saveStorageDataForMenu = () => {
    try {
      const storageData = {
        sessionStorage: saveSessionStorage ? getAllSessionStorage() : {},
        localStorage: saveLocalStorage ? getAllLocalStorage() : {},
      };
      saveStorageDataWithMonkey(storageData);
    } catch (error) {
      // 静默失败，saveStorageDataWithMonkey内部已处理错误提示
    }
  };

  // 写入数据到当前页面（用于油猴菜单）
  const writeStorageToPageForMenu = () => {
    try {
      const storageData = getSavedStorageData();
      writeStorageToCurrentPage(
        storageData,
        saveSessionStorage,
        saveLocalStorage
      );
    } catch (error) {
      // 静默失败，writeStorageToCurrentPage内部已处理错误提示
    }
  };

  // 注册油猴菜单命令
  useEffect(() => {
    // 注册菜单命令
    registerMonkeyMenuCommands(
      showStorageInfoForMenu,
      saveStorageDataForMenu,
      writeStorageToPageForMenu
    );

    // 设置存储数据变化监听器
    setupStorageChangeListener();
  }, [saveSessionStorage, saveLocalStorage]);

  return (
    <div className="App">
      {/* 可拖拽的悬浮按钮 */}
      {buttonVisible && (
        <DraggableButton
          onClick={handleButtonClick}
          position={buttonPosition}
          onPositionChange={handlePositionChange}
        />
      )}

      {/* 存储管理面板模态框 */}
      <StoragePanel visible={panelVisible} onClose={handlePanelClose} />
    </div>
  );
}

export default App;
