// src/pages/DetailPage.jsx

// Detail view: metadata + React Flow visualisation of a single netlist.

import { Card, Skeleton, Descriptions, Divider, Result, List, Layout } from 'antd';
import { useParams } from 'react-router-dom';
import { useNetlist } from '../hooks/useNetlists';
import StatusBadge from '../components/StatusBadge';
import NetlistGraph from '../components/NetlistGraph';
import { ReactFlowProvider, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';

const { Sider, Content } = Layout;

/* ---------- Side panel component ---------- */

function ViolationsPanel({ violations }) {
  const rf = useReactFlow(); // Programmatic control over React Flow instance.

  // Focus graph on the location referenced by a violation rule.
  const focus = loc => {
    if (!loc) return;

    // Focus a component node.
    if (loc.startsWith('component:')) {
      const id = loc.split(':')[1];
      const n  = rf.getNode(id);
      if (n) rf.setCenter(n.position.x, n.position.y, { zoom: 1.5, duration: 500 });
    }

    // Focus the midpoint of an edge (net).
    if (loc.startsWith('net:')) {
      const id = loc.split(':')[1];
      const e  = rf.getEdges().find(ed => ed.id.startsWith(id));
      if (e) {
        const cx = (e.sourceX + e.targetX) / 2;
        const cy = (e.sourceY + e.targetY) / 2;
        rf.setCenter(cx, cy, { zoom: 1.5, duration: 500 });
      }
    }
  };

  // No violations – show success banner.
  if (violations.length === 0) {
    return (
      <Result status="success" title="✔︎ All rules passed" />
    );
  }

  // Render interactive list of violations.
  return (
    <List
      size="small"
      header={`Violations (${violations.length})`}
      bordered
      dataSource={violations}
      renderItem={v => (
        <List.Item
          style={{ cursor: v.location ? 'pointer' : 'default' }}
          onClick={() => focus(v.location)}
        >
          <span style={{ fontFamily: 'monospace', marginRight: 4 }}>{v.rule}</span>
          – {v.message}
        </List.Item>
      )}
    />
  );
}

/* ---------- Main page ---------- */

export default function DetailPage() {
  const { id } = useParams();

  // Fetch the netlist data.
  const { data, isLoading } = useNetlist(id);

  // Show skeleton loader while fetching.
  if (isLoading) return <Skeleton active />;

  // 404 / not found state.
  if (!data) return <Card><p>Not found</p></Card>;

  return (
    <Card title={`Submission ${id.slice(-6)}`} style={{ margin: '1rem' }}>
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="Created">{data.createdAt}</Descriptions.Item>
        <Descriptions.Item label="Status"><StatusBadge status={data.status} /></Descriptions.Item>
        <Descriptions.Item label="Violations">{data.violations.length}</Descriptions.Item>
      </Descriptions>

      <Divider orientation="left">Visualisation</Divider>

      {/* React Flow hooks need a provider in scope */}
      <ReactFlowProvider>
        <Layout>

          {/* Graph canvas */}
          <Content style={{ background: '#fff', paddingRight: 16 }}>
            <NetlistGraph
              netlist={data.netlist}
              violations={data.violations}
            />
          </Content>

          {/* Side panel */}
          <Sider width={300} theme="light">
            <ViolationsPanel violations={data.violations} />
          </Sider>
        </Layout>
      </ReactFlowProvider>
    </Card>
  );
}
