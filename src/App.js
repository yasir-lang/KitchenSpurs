import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [orders, setOrders] = useState([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [filters, setFilters] = useState({ minAmount: "", maxAmount: "", minHour: "", maxHour: "" });
  const [analytics, setAnalytics] = useState({});
  const [topRestaurants, setTopRestaurants] = useState([]);

  
  const [currentPage, setCurrentPage] = useState(1);
  const restaurantsPerPage = 10;

  useEffect(() => {
    axios
      .get("https://yasir.world/KitchenSpurs/api/api.php?endpoint=restaurants")
      .then(res => setRestaurants(res.data.data))
      .catch(err => console.log(err));
  }, []);

  
  useEffect(() => {
    if (!dateRange.start || !dateRange.end) return;

    let url = `https://yasir.world/KitchenSpurs/api/api.php?endpoint=orders&start=${dateRange.start}&end=${dateRange.end}`;
    if (selectedRestaurant) url += `&restaurant_id=${selectedRestaurant}`;

    axios
      .get(url)
      .then(res => setOrders(res.data.data))
      .catch(err => console.log(err));
  }, [selectedRestaurant, dateRange]);

  
  const filteredOrders = orders.filter(order => {
    const hour = parseInt(order.order_time.split("T")[1].split(":")[0]);
    const amount = order.order_amount;
    const { minAmount, maxAmount, minHour, maxHour } = filters;

    if (minAmount && amount < minAmount) return false;
    if (maxAmount && amount > maxAmount) return false;
    if (minHour && hour < minHour) return false;
    if (maxHour && hour > maxHour) return false;

    return true;
  });

  
  useEffect(() => {
    if (!filteredOrders.length) {
      setAnalytics({});
      return;
    }

    const dailyOrders = {};
    const dailyRevenue = {};
    const hourlyCount = {};

    filteredOrders.forEach(order => {
      const [date, time] = order.order_time.split("T");
      const hour = time.split(":")[0];

      dailyOrders[date] = (dailyOrders[date] || 0) + 1;
      dailyRevenue[date] = (dailyRevenue[date] || 0) + order.order_amount;
      hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
    });

    const avgOrderValue = {};
    Object.keys(dailyRevenue).forEach(date => {
      avgOrderValue[date] = dailyRevenue[date] / dailyOrders[date];
    });

    const peakHour = Object.keys(hourlyCount).reduce((a, b) =>
      hourlyCount[a] > hourlyCount[b] ? a : b
    );

    setAnalytics({ dailyOrders, dailyRevenue, avgOrderValue, peakHour });
  }, [filteredOrders]);

  
  useEffect(() => {
    const revenueMap = {};

    orders.forEach(order => {
      revenueMap[order.restaurant_id] = (revenueMap[order.restaurant_id] || 0) + order.order_amount;
    });

    const sorted = Object.entries(revenueMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, revenue]) => {
        const r = restaurants.find(r => r.id === parseInt(id));
        return { name: r?.name || `Restaurant ${id}`, revenue };
      });

    setTopRestaurants(sorted);
  }, [orders, restaurants]);

  
  const displayedRestaurants = restaurants
    .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  
  const indexOfLast = currentPage * restaurantsPerPage;
  const indexOfFirst = indexOfLast - restaurantsPerPage;
  const currentRestaurants = displayedRestaurants.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(displayedRestaurants.length / restaurantsPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Restaurant Dashboard(KitchenSpur)</h1>

      
      <div className="row mb-3">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search restaurants..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); 
            }}
          />
        </div>
        <div className="col-md-6">
          <select
            className="form-select"
            value={selectedRestaurant}
            onChange={e => setSelectedRestaurant(e.target.value)}
          >
            <option value="">--All Restaurants--</option>
            {currentRestaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

   
      <div className="d-flex justify-content-center mb-3">
        <button className="btn btn-secondary me-2" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          Prev
        </button>
        <span className="align-self-center">Page {currentPage} of {totalPages}</span>
        <button className="btn btn-secondary ms-2" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>

      
      <div className="row mb-3">
        <div className="col-md-3">
          <label>Start Date:</label>
          <input
            type="date"
            className="form-control"
            value={dateRange.start}
            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
          />
        </div>
        <div className="col-md-3">
          <label>End Date:</label>
          <input
            type="date"
            className="form-control"
            value={dateRange.end}
            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
          />
        </div>
        <div className="col-md-2">
          <label>Min Amount:</label>
          <input
            type="number"
            className="form-control"
            value={filters.minAmount}
            onChange={e => setFilters({ ...filters, minAmount: e.target.value })}
          />
        </div>
        <div className="col-md-2">
          <label>Max Amount:</label>
          <input
            type="number"
            className="form-control"
            value={filters.maxAmount}
            onChange={e => setFilters({ ...filters, maxAmount: e.target.value })}
          />
        </div>
        <div className="col-md-1">
          <label>Min Hour:</label>
          <input
            type="number"
            min="0"
            max="23"
            className="form-control"
            value={filters.minHour}
            onChange={e => setFilters({ ...filters, minHour: e.target.value })}
          />
        </div>
        <div className="col-md-1">
          <label>Max Hour:</label>
          <input
            type="number"
            min="0"
            max="23"
            className="form-control"
            value={filters.maxHour}
            onChange={e => setFilters({ ...filters, maxHour: e.target.value })}
          />
        </div>
      </div>

     
      {filteredOrders.length > 0 && (
        <div className="mb-4">
          <h3>Order Analytics</h3>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Date</th>
                <th>Orders Count</th>
                <th>Revenue (₹)</th>
                <th>Avg Order Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(analytics.dailyOrders || {}).map(date => (
                <tr key={date}>
                  <td>{date}</td>
                  <td>{analytics.dailyOrders[date]}</td>
                  <td>{analytics.dailyRevenue[date]}</td>
                  <td>{analytics.avgOrderValue[date].toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p><strong>Peak Order Hour:</strong> {analytics.peakHour}:00</p>
        </div>
      )}

     
      <div className="mb-4">
        <h3>Top 3 Restaurants by Revenue</h3>
        <ol>
          {topRestaurants.map(r => (
            <li key={r.name}>
              {r.name}: ₹{r.revenue}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default App;
