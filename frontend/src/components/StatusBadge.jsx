// src/components/StatusBadge.jsx

// Small coloured tag that shows whether a submission is valid.

import { Tag, Tooltip } from 'antd';

export default function StatusBadge({ status }) {

  // Map status → tag colour.
  const color = status === 'valid' ? 'green' : 'red';

  // Upper-case text for consistency.
  const text  = status?.toUpperCase?.() ?? 'UNKNOWN';

  return (
    <Tooltip title={status === 'valid' ? 'All rules passed' : 'Rule violations'}>
      <Tag color={color}>{text}</Tag>
    </Tooltip>
  );
}
