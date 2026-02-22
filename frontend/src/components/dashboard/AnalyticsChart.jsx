import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { format, subDays, eachDayOfInterval } from "date-fns";
import api from "../../utils/api";
import Loader from "../common/Loader";

// ✅ Register chart components ONCE
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsChart = ({ roomId, timeRange = 30 }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (roomId) fetchAnalytics();
  }, [roomId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get(`/analytics/room/${roomId}`, {
        params: { timeRange },
      });

      const analytics = res.data.data || [];

      const end = new Date();
      const start = subDays(end, timeRange - 1);
      const days = eachDayOfInterval({ start, end });

      const labels = days.map(d => format(d, "MMM dd"));

      const mapMetric = (key) =>
        days.map(d => {
          const dateStr = format(d, "yyyy-MM-dd");
          return analytics.find(a => a.date === dateStr)?.[key] || 0;
        });

      setChartData({
        labels,
        datasets: [
          {
            label: "Views",
            data: mapMetric("views"),
            borderColor: "rgb(59,130,246)",
            backgroundColor: "rgba(59,130,246,0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Inquiries",
            data: mapMetric("inquiries"),
            borderColor: "rgb(16,185,129)",
            backgroundColor: "rgba(16,185,129,0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Visit Requests",
            data: mapMetric("visitRequests"),
            borderColor: "rgb(245,101,101)",
            backgroundColor: "rgba(245,101,101,0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: `Room Analytics - Last ${timeRange} days`,
      },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  if (loading) return <Loader />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!chartData) return <p>No analytics data</p>;

  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default AnalyticsChart;
