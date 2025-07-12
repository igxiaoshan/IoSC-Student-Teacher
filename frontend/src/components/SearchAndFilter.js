import React, { useState } from 'react';
import {
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Grid,
    Paper,
    Typography,
    Chip,
    IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';

const SearchAndFilter = ({ 
    onSearch, 
    onFilter, 
    searchPlaceholder = "搜索...", 
    filterOptions = [],
    showAdvancedFilters = false 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({});
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = () => {
        onSearch(searchTerm);
    };

    const handleFilterChange = (filterKey, value) => {
        const newFilters = { ...filters, [filterKey]: value };
        setFilters(newFilters);
        onFilter(newFilters);
    };

    const clearFilters = () => {
        setFilters({});
        setSearchTerm('');
        onSearch('');
        onFilter({});
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
                {/* 搜索框 */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleKeyPress}
                        InputProps={{
                            endAdornment: (
                                <IconButton onClick={handleSearch}>
                                    <SearchIcon />
                                </IconButton>
                            )
                        }}
                    />
                </Grid>

                {/* 筛选按钮 */}
                <Grid item xs={12} md={3}>
                    <Button
                        variant="outlined"
                        startIcon={<FilterListIcon />}
                        onClick={() => setShowFilters(!showFilters)}
                        fullWidth
                    >
                        筛选
                    </Button>
                </Grid>

                {/* 清除按钮 */}
                <Grid item xs={12} md={3}>
                    <Button
                        variant="outlined"
                        startIcon={<ClearIcon />}
                        onClick={clearFilters}
                        fullWidth
                    >
                        清除
                    </Button>
                </Grid>

                {/* 高级筛选选项 */}
                {showFilters && filterOptions.length > 0 && (
                    <Grid item xs={12}>
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                筛选选项
                            </Typography>
                            <Grid container spacing={2}>
                                {filterOptions.map((option) => (
                                    <Grid item xs={12} sm={6} md={4} key={option.key}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>{option.label}</InputLabel>
                                            <Select
                                                value={filters[option.key] || ''}
                                                onChange={(e) => handleFilterChange(option.key, e.target.value)}
                                                label={option.label}
                                            >
                                                <MenuItem value="">
                                                    <em>全部</em>
                                                </MenuItem>
                                                {option.options.map((opt) => (
                                                    <MenuItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Grid>
                )}

                {/* 当前筛选条件显示 */}
                {(searchTerm || Object.keys(filters).some(key => filters[key])) && (
                    <Grid item xs={12}>
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                                当前筛选条件：
                            </Typography>
                            <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {searchTerm && (
                                    <Chip
                                        label={`搜索: ${searchTerm}`}
                                        size="small"
                                        onDelete={() => {
                                            setSearchTerm('');
                                            onSearch('');
                                        }}
                                    />
                                )}
                                {Object.entries(filters).map(([key, value]) => {
                                    if (!value) return null;
                                    const option = filterOptions.find(opt => opt.key === key);
                                    const valueLabel = option?.options.find(opt => opt.value === value)?.label || value;
                                    return (
                                        <Chip
                                            key={key}
                                            label={`${option?.label}: ${valueLabel}`}
                                            size="small"
                                            onDelete={() => handleFilterChange(key, '')}
                                        />
                                    );
                                })}
                            </Box>
                        </Box>
                    </Grid>
                )}
            </Grid>
        </Paper>
    );
};

export default SearchAndFilter;
