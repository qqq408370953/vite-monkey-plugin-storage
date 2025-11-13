import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import monkey, { cdn,util } from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    monkey({
      entry: 'src/main.tsx',
      // server: { mountGmApi: true },
      userscript: {
        name:'stroage-sync-plugin',
        version: '1.0.0',
        author: 'gyf',
        icon: 'https://vitejs.dev/logo.svg',
        namespace: 'npm/vite-plugin-monkey',
        match: ['*://*/*'],
        grant: ["GM.getResourceText","GM.getTabs","GM_xmlhttpRequest","GM_openInTab","GM_setValue","GM_getValue","GM_deleteValue","GM_registerMenuCommand","GM_addValueChangeListener","unsafeWindow"],
        connect: ['*'],
        // 确保脚本在所有其他脚本之前执行
        noframes: true,
      },
      build: {
        externalGlobals: {
          'react': cdn.jsdelivr('React', 'umd/react.production.min.js'),
          'react-dom': cdn.jsdelivr('ReactDOM', 'umd/react-dom.production.min.js'),
          'antd': cdn.jsdelivr('antd', 'dist/antd.js'),
        },
        externalResource: {
          'vite-plugin-monkey/dist/client.js': cdn.jsdelivr('vite-plugin-monkey', 'dist/client.js'),  
          'antd/dist/antd.min.css': cdn.jsdelivr('antd', 'dist/antd.min.css'),
        },
      }
    }),
  ],
  
});
