import React from 'react';
import { SearchInput } from '../../../components/ui';

export default function SearchBar({ placeholder = 'Tìm kiếm', value, onChange }) {
    return <SearchInput value={value} onChange={onChange} placeholder={placeholder} />;
}
