// src/pages/ListPage.jsx

// Paginated table of all netlist submissions.


import { Table } from 'antd';
import { useNetlists } from '../hooks/useNetlists';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import StatusBadge from '../components/StatusBadge';

export default function ListPage() {
  const { data, isLoading } = useNetlists();

  // Define column config for Ant Design table.
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',

      // Display only last 6 chars (easier to read) but keep full id in link.
      render: id => <Link to={`/netlists/${id}`}>{id.slice(-6)}</Link>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',

      // Format timestamp and enable sorting.
      render: t => dayjs(t).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.createdAt) - dayjs(b.createdAt),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: s => <StatusBadge status={s} />,

      // Quick filters for valid/invalid states.
      filters: [
        { text: 'Valid',   value: 'valid' },
        { text: 'Invalid', value: 'invalid' },
      ],
      onFilter: (v, record) => record.status === v,
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={isLoading}
      columns={columns}
      dataSource={data?.items ?? []}
      pagination={{ pageSize: 10, total: data?.total ?? 0 }}
    />
  );
}
