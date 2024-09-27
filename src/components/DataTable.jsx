import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import moment from 'moment';
import Fuse from 'fuse.js';
import { FaArrowUp, FaArrowDown, FaChevronLeft, FaChevronRight, FaEye, FaBars, FaLayerGroup } from 'react-icons/fa';

const dataUrl = "/sample-data.json";

const DataTable = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState([]);
    const [columnsVisibility, setColumnsVisibility] = useState({
        name: true,
        category: true,
        subcategory: true,
        price: true,
        createdAt: true,
        updatedAt: true
    });
    const [currentPage, setCurrentPage] = useState(1);
    const resultsPerPage = 10;
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [subcategoryOptions, setSubcategoryOptions] = useState([]);
    const [showColumnSlider, setShowColumnSlider] = useState(false); // State for column visibility slider
    const [showGroupingSlider, setShowGroupingSlider] = useState(false);//grouping slider
    const [showFilterSlider, setShowFilterSlider] = useState(false); // State for filter slider
    const [searchTerm, setSearchTerm] = useState(''); // For fuzzy text search
    const [minPrice, setMinPrice] = useState(0); // Min price for the price range slider
    const [maxPrice, setMaxPrice] = useState(500); // Max price for the price range slider
    const [startDate, setStartDate] = useState(''); // Start date for the date range filter
    const [endDate, setEndDate] = useState(''); // End date for the date range filter
    const [groupBy, setGroupBy] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const styles = {
        tableHeader: "border-b border-gray-300 text-center p-3 cursor-pointer",
        tableCell: "border-b border-gray-300 p-3 text-center",
        button: "bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition",
        buttonDisabled: "bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed",
        pagination: "flex justify-between items-center mt-4",
        slider: "fixed top-0 right-0 w-1/4 h-full bg-white shadow-lg z-50 p-4 transition-transform transform",
        sliderHidden: "translate-x-full",
        sliderVisible: "translate-x-0",
        overlay: "fixed inset-0 bg-gray-900 opacity-50 z-40",
        toggle: "relative inline-flex items-center cursor-pointer",
        toggleInput: "sr-only peer",
        toggleBg: "w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch(dataUrl);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const jsonData = await response.json();
                setData(jsonData);
                setFilteredData(jsonData);
                const uniqueCategories = [...new Set(jsonData.map(item => item.category))].map(cat => ({ value: cat, label: cat }));
                const uniqueSubcategories = [...new Set(jsonData.map(item => item.subcategory))].map(sub => ({ value: sub, label: sub }));
                setCategoryOptions(uniqueCategories);
                setSubcategoryOptions(uniqueSubcategories);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Fuzzy Search configuration
    const fuse = new Fuse(data, {
        keys: ['name'],
        threshold: 0.3,
    });

    const groupData = (data, groupBy) => {
        if (!groupBy) return data;

        const groupedData = data.reduce((acc, item) => {
            const key = item[groupBy];
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(item);
            return acc;
        }, {});

        return Object.entries(groupedData).map(([group, items]) => ({
            group,
            items,
        }));
    };

    useEffect(() => {
        let filtered = data;

        if (searchTerm) {
            const results = fuse.search(searchTerm).map(({ item }) => item);
            filtered = results;
        }

        filtered = filtered.filter(item => item.price >= minPrice && item.price <= maxPrice);

        // Filter by date range
        if (startDate && endDate) {
            filtered = filtered.filter(item =>
                moment(item.createdAt).isBetween(startDate, endDate, null, '[]')
            );
        }

        // Filter by selected categories
        if (selectedCategories.length > 0) {
            const selected = selectedCategories.map(cat => cat.value);
            filtered = filtered.filter(item => selected.includes(item.category));
        }

        // Filter by selected subcategories
        if (selectedSubcategories.length > 0) {
            const selected = selectedSubcategories.map(sub => sub.value);
            filtered = filtered.filter(item => selected.includes(item.subcategory));
        }

        if (groupBy) {
            filtered = groupData(filtered, groupBy);
        }

        setFilteredData(filtered);
    }, [searchTerm, minPrice, maxPrice, selectedCategories, selectedSubcategories, startDate, endDate, groupBy, data]);

    const handleSort = (column) => {
        let direction = 'asc';
        if (sortConfig.key === column && sortConfig.direction === 'asc') {
            direction = 'desc';
        }

        setSortConfig({ key: column, direction });
        const sortedData = [...filteredData].sort((a, b) => {
            const aValue = a[column];
            const bValue = b[column];

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return direction === 'asc' ? aValue - bValue : bValue - aValue;
            }
            if (aValue instanceof Date && bValue instanceof Date) {
                return direction === 'asc'
                    ? new Date(aValue) - new Date(bValue)
                    : new Date(bValue) - new Date(aValue);
            }
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return direction === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
            return 0;
        });
        setFilteredData(sortedData);
    };


    const toggleColumnVisibility = (column) => {
        setColumnsVisibility({
            ...columnsVisibility,
            [column]: !columnsVisibility[column],
        });
    };

    const indexOfLastResult = currentPage * resultsPerPage;
    const indexOfFirstResult = indexOfLastResult - resultsPerPage;
    const currentResults = filteredData.slice(indexOfFirstResult, indexOfLastResult);

    if (loading) {
        return <div className="text-center">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-600 text-center">Error: {error}</div>;
    }

    return (
        <div className="container mx-auto p-4 relative">
            <h2 className="text-gray-800 text-5xl font-semibold mb-2">Table View</h2>
            <hr className="border-gray-300 mb-4" />

            <div className="flex justify-between items-center mb-4">
                <input
                    type="text"
                    placeholder="Search by name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border rounded p-2 w-1/4 mr-2"
                />
                <div className="flex items-center">
                    <FaArrowUp
                        className={`ml-2 cursor-pointer ${sortConfig.direction === 'asc' ? 'text-gray-800' : 'text-gray-500'}`}
                        onClick={() => handleSort(sortConfig.key || 'name', 'category', 'subcategory', 'price', 'createdAt', 'updatedAt')}
                    />
                    <FaArrowDown
                        className={`ml-2 cursor-pointer ${sortConfig.direction === 'desc' ? 'text-gray-800' : 'text-gray-500'}`}
                        onClick={() => handleSort(sortConfig.key || 'name', 'category', 'subcategory', 'price', 'createdAt', 'updatedAt')}
                    />
                    <FaEye
                        className="ml-4 cursor-pointer text-gray-600"
                        onClick={() => setShowColumnSlider(!showColumnSlider)}
                    />
                    <FaBars
                        className="ml-4 cursor-pointer text-gray-600"
                        onClick={() => setShowGroupingSlider(!showGroupingSlider)}
                    />
                    <FaLayerGroup
                        className="ml-4 cursor-pointer text-gray-600"
                        onClick={() => setShowFilterSlider(!showFilterSlider)}
                    />
                </div>
            </div>

            <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-100">
                    <tr>
                        {columnsVisibility.name && (
                            <th className={styles.tableHeader} onClick={() => handleSort('name')}>
                                Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <FaArrowUp className={`inline-block ml-1 ${sortConfig.direction === 'asc' ? 'text-gray-800' : 'text-gray-500'}`} /> : <FaArrowDown className={`inline-block ml-1 ${sortConfig.direction === 'desc' ? 'text-gray-800' : 'text-gray-500'}`} />)}
                            </th>
                        )}
                        {columnsVisibility.category && (
                            <th className={styles.tableHeader} onClick={() => handleSort('category')}>
                                Category {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? <FaArrowUp className={`inline-block ml-1 ${sortConfig.direction === 'asc' ? 'text-gray-800' : 'text-gray-500'}`} /> : <FaArrowDown className={`inline-block ml-1 ${sortConfig.direction === 'desc' ? 'text-gray-800' : 'text-gray-500'}`} />)}
                            </th>
                        )}
                        {columnsVisibility.subcategory && (
                            <th className={styles.tableHeader} onClick={() => handleSort('subcategory')}>
                                Subcategory {sortConfig.key === 'subcategory' && (sortConfig.direction === 'asc' ? <FaArrowUp className={`inline-block ml-1 ${sortConfig.direction === 'asc' ? 'text-gray-800' : 'text-gray-500'}`} /> : <FaArrowDown className={`inline-block ml-1 ${sortConfig.direction === 'desc' ? 'text-gray-800' : 'text-gray-500'}`} />)}
                            </th>
                        )}
                        {columnsVisibility.price && (
                            <th className={styles.tableHeader} onClick={() => handleSort('price')}>
                                Price {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? <FaArrowUp className={`inline-block ml-1 ${sortConfig.direction === 'asc' ? 'text-gray-800' : 'text-gray-500'}`} /> : <FaArrowDown className={`inline-block ml-1 ${sortConfig.direction === 'desc' ? 'text-gray-800' : 'text-gray-500'}`} />)}
                            </th>
                        )}
                        {columnsVisibility.createdAt && (
                            <th className={styles.tableHeader} onClick={() => handleSort('createdAt')}>
                                Created At {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? <FaArrowUp className={`inline-block ml-1 ${sortConfig.direction === 'asc' ? 'text-gray-800' : 'text-gray-500'}`} /> : <FaArrowDown className={`inline-block ml-1 ${sortConfig.direction === 'desc' ? 'text-gray-800' : 'text-gray-500'}`} />)}
                            </th>
                        )}
                        {columnsVisibility.updatedAt && (
                            <th className={styles.tableHeader} onClick={() => handleSort('updatedAt')}>
                                Updated At {sortConfig.key === 'updatedAt' && (sortConfig.direction === 'asc' ? <FaArrowUp className={`inline-block ml-1 ${sortConfig.direction === 'asc' ? 'text-gray-800' : 'text-gray-500'}`} /> : <FaArrowDown className={`inline-block ml-1 ${sortConfig.direction === 'desc' ? 'text-gray-800' : 'text-gray-500'}`} />)}
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(filteredData) && filteredData.length > 0 && filteredData[0].group
                        ? filteredData.slice(indexOfFirstResult, indexOfLastResult).map((group, index) => (
                            <React.Fragment key={index}>
                                {/* Render group header */}
                                <tr className="bg-gray-200">
                                    <td colSpan={6} className={styles.tableCell}>{group.group}</td>
                                </tr>
                                {/* Render group items */}
                                {group.items.map((item, idx) => (
                                    <tr key={idx}>
                                        {columnsVisibility.name && <td className={styles.tableCell}>{item.name}</td>}
                                        {columnsVisibility.category && <td className={styles.tableCell}>{item.category}</td>}
                                        {columnsVisibility.subcategory && <td className={styles.tableCell}>{item.subcategory}</td>}
                                        {columnsVisibility.price && <td className={styles.tableCell}>{item.price}</td>}
                                        {columnsVisibility.createdAt && <td className={styles.tableCell}>{moment(item.createdAt).format('DD-MMM-YYYY HH:mm')}</td>}
                                        {columnsVisibility.updatedAt && <td className={styles.tableCell}>{moment(item.updatedAt).format('DD-MMM-YYYY HH:mm')}</td>}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))
                        : currentResults.map((item, index) => (
                            <tr key={index}>
                                {columnsVisibility.name && <td className={styles.tableCell}>{item.name}</td>}
                                {columnsVisibility.category && <td className={styles.tableCell}>{item.category}</td>}
                                {columnsVisibility.subcategory && <td className={styles.tableCell}>{item.subcategory}</td>}
                                {columnsVisibility.price && <td className={styles.tableCell}>{item.price}</td>}
                                {columnsVisibility.createdAt && <td className={styles.tableCell}>{moment(item.createdAt).format('DD-MMM-YYYY HH:mm')}</td>}
                                {columnsVisibility.updatedAt && <td className={styles.tableCell}>{moment(item.updatedAt).format('DD-MMM-YYYY HH:mm')}</td>}
                            </tr>
                        ))}
                </tbody>
            </table>

            <div className={styles.pagination}>
                <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={currentPage === 1 ? styles.buttonDisabled : styles.button}
                >
                    <FaChevronLeft />
                </button>
                <span>
                    Page {currentPage} of {Math.ceil(filteredData.length / resultsPerPage)}
                </span>
                <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={indexOfLastResult >= filteredData.length}
                    className={indexOfLastResult >= filteredData.length ? styles.buttonDisabled : styles.button}
                >
                    <FaChevronRight />
                </button>
            </div>

            {/* Column visibility slider */}
            {showColumnSlider && (
                <>
                    <div className={styles.overlay} onClick={() => setShowColumnSlider(false)}></div>
                    <div className={`${styles.slider} ${showColumnSlider ? styles.sliderVisible : styles.sliderHidden}`}>
                        <h4 className="font-semibold mb-4">Show/Hide Columns</h4>
                        {Object.keys(columnsVisibility).map((column) => (
                            <div key={column} className="flex items-center justify-between mb-2">
                                <span className="capitalize">{column}</span>
                                <label className={styles.toggle}>
                                    <input
                                        type="checkbox"
                                        className={styles.toggleInput}
                                        checked={columnsVisibility[column]}
                                        onChange={() => toggleColumnVisibility(column)}
                                    />
                                    <div className={styles.toggleBg}></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </>
            )}
            {/* Grouping Slider */}
            {showGroupingSlider && (
                <>
                    <div className={styles.overlay} onClick={() => setShowGroupingSlider(false)}></div>
                    <div className={`${styles.slider} ${showGroupingSlider ? styles.sliderVisible : styles.sliderHidden}`}>
                        <h4 className="font-semibold mb-4">Group By</h4>
                        <div className="flex items-center justify-between mb-2">
                            <span>Category</span>
                            <label className={styles.toggle}>
                                <input className='h-5 w-6 cursor-pointer'
                                    type="radio"
                                    name="groupBy"
                                    value="category"
                                    checked={groupBy === 'category'}
                                    onChange={() => setGroupBy('category')}
                                />
                            </label>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span>Subcategory</span>
                            <label className={styles.toggle}>
                                <input className='h-5 w-6 cursor-pointer'
                                    type="radio"
                                    name="groupBy"
                                    value="subcategory"
                                    checked={groupBy === 'subcategory'}
                                    onChange={() => setGroupBy('subcategory')}
                                />
                            </label>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span>None</span>
                            <label className={styles.toggle}>
                                <input className='h-5 w-6 cursor-pointer'
                                    type="radio"
                                    name="groupBy"
                                    value=""
                                    checked={groupBy === ''}
                                    onChange={() => setGroupBy('')}
                                />
                            </label>
                        </div>
                    </div>
                </>
            )}
            {/* Advanced Filter Slider */}
            {showFilterSlider && (
                <>
                    <div className={styles.overlay} onClick={() => setShowFilterSlider(false)}></div>
                    <div className={`${styles.slider} ${showFilterSlider ? styles.sliderVisible : styles.sliderHidden}`}>
                        <h4 className="font-semibold mb-4">Advanced Filters 🔍</h4>

                        {/* Fuzzy Text Search */}
                        <input
                            type="text"
                            placeholder="Fuzzy search by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border rounded p-2 w-full mb-4"
                        />

                        <h5>Category </h5>
                        <Select
                            isMulti
                            options={categoryOptions}
                            value={selectedCategories}
                            onChange={setSelectedCategories}
                            placeholder="Select Categories"
                            className="mb-4"
                        />

                        <h5>Sub-Category</h5>
                        <Select
                            isMulti
                            options={subcategoryOptions}
                            value={selectedSubcategories}
                            onChange={setSelectedSubcategories}
                            placeholder="Select Subcategories"
                            className="mb-4"
                        />

                        {/* Price Range Slider */}
                        <h5>Price Range 💸</h5>
                        <div className="mb-4">
                            <label>Price Range: {minPrice} - {maxPrice}</label>
                            <input
                                type="range"
                                min="0"
                                max="500"
                                value={minPrice}
                                onChange={(e) => setMinPrice(Number(e.target.value))}
                                className="w-full mb-2 accent-blue-500"
                            />
                            <input
                                type="range"
                                min="0"
                                max="500"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(Number(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                        </div>

                        {/* Date Range Picker */}
                        <h5>Date Range 📅</h5>
                        <div className="mb-4">
                            <label>Created At (Start Date)</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="block w-full mb-2"
                            />
                            <label>Uodated At (End Date)</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="block w-full"
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DataTable;
