// src/App.jsx
//
// Application shell: Ant Design sidebar + routed pages.
// Routes:
//  • "/"              – submissions table
//  • "/upload"        – drag-and-drop uploader
//  • "/netlists/:id"  – netlist detail view
//

import React from 'react';
import { Layout, Menu } from 'antd';
import { UploadOutlined, OrderedListOutlined } from '@ant-design/icons';
import { Link, Routes, Route, useLocation } from 'react-router-dom';

import ListPage from './pages/ListPage';
import UploadPage from './pages/UploadPage';
import DetailPage from './pages/DetailPage';

const { Sider, Content } = Layout;

export default function App() {

  // Determine which sidebar item should be highlighted.
  const location = useLocation();

  // The Menu component expects an array of selected keys.
  const selectedKeys = location.pathname.startsWith('/upload')
    ? ['upload']
    : ['list'];

  return (
    <Layout style={{ minHeight: '100vh' }}>

      {/* ------------ Sidebar navigation ------------ */}
      <Sider>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          items={[
            {
              key: 'list',
              icon: <OrderedListOutlined />,

              // Link to the submissions page.
              label: <Link to="/">Submissions</Link>,
            },
            {
              key: 'upload',
              icon: <UploadOutlined />,

              // Link to the upload page.
              label: <Link to="/upload">Upload</Link>,
            },
          ]}
        />
      </Sider>

      {/* ------------- Routed page content ------------ */}
      <Content style={{ padding: '24px' }}>
        <Routes>

          {/* List of previous submissions */}
          <Route path="/" element={<ListPage />} />

          {/* File uploader */}
          <Route path="/upload" element={<UploadPage />} />

          {/* Detail + visualisation for a single netlist */}
          <Route path="/netlists/:id" element={<DetailPage />} />
        </Routes>
      </Content>
    </Layout>
  );
}
