import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';

interface DraggableButtonProps {
  onClick: () => void;
  visible?: boolean;
  position: { x: string; y: string };
  onPositionChange: (position: { x: string; y: string }) => void;
}

const DraggableButton: React.FC<DraggableButtonProps> = ({ onClick, visible = true, position, onPositionChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false); // 标记是否进行了拖拽移动
  const buttonRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 }); // 记录鼠标按下的位置

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setHasDragged(false); // 重置拖拽标志
    
    const buttonRect = buttonRef.current?.getBoundingClientRect();
    if (buttonRect) {
      offsetRef.current = {
        x: e.clientX - buttonRect.left,
        y: e.clientY - buttonRect.top
      };
    }
    
    // 记录鼠标按下的位置
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY
    };
  };

  // 处理鼠标移动事件
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // 检查是否有实际移动（超过一定阈值）
    const moveThreshold = 3; // 移动阈值，像素
    const deltaX = Math.abs(e.clientX - startPosRef.current.x);
    const deltaY = Math.abs(e.clientY - startPosRef.current.y);
    
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      setHasDragged(true);
    }
    
    const x = e.clientX - offsetRef.current.x;
    const y = e.clientY - offsetRef.current.y;
    
    // 确保按钮不会移出视口
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const buttonWidth = 60;
    const buttonHeight = 60;
    
    const clampedX = Math.max(0, Math.min(x, windowWidth - buttonWidth));
    const clampedY = Math.max(0, Math.min(y, windowHeight - buttonHeight));
    
    onPositionChange({
      x: `${clampedX}px`,
      y: `${clampedY}px`
    });
  };

  // 处理鼠标释放事件
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 添加全局事件监听器
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  if (!visible) return null;

  return (
    <div
      ref={buttonRef}
      id="draggable-button-flag"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 999999999999999,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'transform 0.2s ease',
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
      }}
      onMouseDown={handleMouseDown}
    >
      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={<DatabaseOutlined />}
        onClick={(e) => {
          // 只有在没有拖拽的情况下才触发点击事件
          if (!hasDragged) {
            onClick();
          }
        }}
        style={{
          width: 60,
          height: 60,
          border: 'none',
          outline: 'none'
        }}
        title="点击打开存储管理工具"
      />
    </div>
  );
};

export default DraggableButton;