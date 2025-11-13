import React, { useState, useEffect } from "react";
import { Modal, Card, Input, Button, Checkbox, Row, Col, message } from "antd";
import {
  CopyOutlined,
  SaveOutlined,
  SendOutlined,
  GlobalOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import {
  StorageData,
  WriteStorageResult,
  generateStorageInfoText,
  getAllSessionStorage,
  getAllLocalStorage,
  writeStorageToCurrentPage,
} from "../utils/storageUtils";
import {
  saveStorageDataWithMonkey,
  getSavedStorageData,
  openTargetWebsite,
  cleanupTempStorage,
} from "../utils/monkeyUtils";
import { GM_setValue, GM_getValue } from "vite-plugin-monkey/dist/client";
const { TextArea } = Input;

interface StoragePanelProps {
  visible: boolean;
  onClose: () => void;
}

const StoragePanel: React.FC<StoragePanelProps> = ({ visible, onClose }) => {
  const [targetUrl, setTargetUrl] = useState("http://localhost:4000/");
  const [saveSessionStorage, setSaveSessionStorage] = useState(true);
  const [saveLocalStorage, setSaveLocalStorage] = useState(true);
  const [storageInfo, setStorageInfo] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  // 显示当前页面存储信息
  const handleShowStorageInfo = () => {
    try {
      const infoText = generateStorageInfoText();
      setStorageInfo(infoText);
      message.info("已获取当前页面存储信息");
    } catch (error) {}
  };

  // 获取并保存当前页面的存储数据
  const handleSaveStorageData = (): StorageData => {
    const storageData: StorageData = {
      sessionStorage: {},
      localStorage: {},
    };

    if (saveSessionStorage) {
      storageData.sessionStorage = getAllSessionStorage();
    }

    if (saveLocalStorage) {
      storageData.localStorage = getAllLocalStorage();
    }

    saveStorageDataWithMonkey(storageData);
    return storageData;
  };

  // 主处理函数：获取并保存数据，然后打开目标网站
  const handleSaveAndOpen = async () => {
    setIsLoading(true);
    try {
      // 保存当前页面的数据
      const storageData = handleSaveStorageData();
      const sessionKeys = Object.keys(storageData.sessionStorage);
      const localKeys = Object.keys(storageData.localStorage);
      // 创建自动同步信息
      const syncInfo = {
        timestamp: Date.now(),
        hasData: sessionKeys.length > 0 || localKeys.length > 0,
        saveSessionStorage,
        saveLocalStorage,
      };
      // 使用油猴的API进行跨页面通信（不依赖localStorage的跨域限制）
      try {
        // 首先尝试使用GM_setValue存储同步标记（使用同步方式）
        // @ts-ignore - GM函数由油猴脚本环境提供
        if (typeof GM_setValue === "function") {
          GM_setValue("__storage_sync_needed", syncInfo);

          // 验证设置是否成功
          // @ts-ignore
          if (typeof GM_getValue === "function") {
            const storedSyncInfo = GM_getValue("__storage_sync_needed");
          }
        } else {
          throw new Error("GM_setValue not available");
        }
      } catch (gmError) {
        // 降级到localStorage（虽然在跨域情况下可能不可靠）
        try {
          localStorage.setItem(
            "__storage_sync_needed",
            JSON.stringify(syncInfo)
          );
        } catch (storageError) {
          message.warning("无法设置自动同步标记，数据可能无法自动同步到新页面");
        }
      }
      // 打开目标网站
      const opened = openTargetWebsite(targetUrl);

      if (opened) {
        message.info("正在准备数据同步到目标网站...");
        // 关闭当前面板
        onClose();
      } else {
      }
    } catch (error) {
      message.error("处理失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Modal
      title=""
      open={visible}
      onCancel={onClose}
      footer={null}
      width={440}
      style={{
        top: 40,
      }}
      closable={false}
      destroyOnClose
      maskClosable
    >
      <Card
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Storage 管理工具</span>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={onClose}
              style={{ fontSize: "16px" }}
              title="关闭"
            />
          </div>
        }
        style={{
          border: "none",
          boxShadow: "none",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            <GlobalOutlined /> 目标网站地址
          </div>
          <Input
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="请输入目标网站地址，例如：http://localhost:4000/"
            style={{ marginBottom: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            数据选项
          </div>
          <Row>
            <Col span={24}>
              <Checkbox
                checked={saveSessionStorage}
                onChange={(e) => setSaveSessionStorage(e.target.checked)}
              >
                包含 Session Storage
              </Checkbox>
            </Col>
            <Col span={24}>
              <Checkbox
                checked={saveLocalStorage}
                onChange={(e) => setSaveLocalStorage(e.target.checked)}
              >
                包含 Local Storage
              </Checkbox>
            </Col>
          </Row>
        </div>

        {storageInfo && (
          <TextArea
            value={storageInfo}
            rows={3}
            readOnly
            style={{ marginBottom: "16px", backgroundColor: "#f5f5f5" }}
          />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Button
            type="default"
            icon={<CopyOutlined />}
            onClick={handleShowStorageInfo}
            loading={isLoading}
          >
            显示当前页面存储信息
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveAndOpen}
            loading={isLoading}
          >
            获取当前页面数据并打开目标网站
          </Button>
          {/* <Button
            icon={<SendOutlined />}
            onClick={handleWriteStorageToPage}
            loading={isLoading}
          >
            将保存的数据写入当前页面
          </Button> */}
        </div>
      </Card>
    </Modal>
  );
};

export default StoragePanel;
