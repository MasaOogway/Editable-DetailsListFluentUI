import { render } from '@testing-library/react';
import React from 'react';
import FilterCallout from '../libs/editablegrid/columnfiltercallout/filtercallout';
import { vi } from 'vitest';

describe('FilterCallout', () => {
  it('should render Callout component with correct props', () => {
    const columnClass = 'example-column';
    const columnKey = 'example-key';
    const columnName = 'Example Column';
    const filterList = [
      { text: 'Option 1', isChecked: false },
      { text: 'Option 2', isChecked: true },
      { text: 'Option 3', isChecked: false }
    ];

    const onCancel = vi.fn();
    const onApply = vi.fn();

    const { container } = render(
      <FilterCallout
        columnClass={columnClass}
        columnKey={columnKey}
        columnName={columnName}
        filterList={filterList}
        onCancel={onCancel}
        onApply={onApply}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
