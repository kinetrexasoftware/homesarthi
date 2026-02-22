import { motion } from 'framer-motion';

const AdminStatCard = ({ title, value, trend, icon: Icon, color = 'blue', onClick }) => {
    const colors = {
        blue: 'border-blue-100 text-blue-600 bg-blue-50',
        green: 'border-green-100 text-green-600 bg-green-50',
        yellow: 'border-yellow-100 text-yellow-600 bg-yellow-50',
        red: 'border-red-100 text-red-600 bg-red-50',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={onClick ? { scale: 1.02 } : {}}
            whileTap={onClick ? { scale: 0.98 } : {}}
            onClick={onClick}
            className={`p-6 bg-white rounded-[2rem] border-2 ${colors[color].split(' ')[0]} shadow-sm hover:shadow-md transition-all flex items-start justify-between group ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
                    {trend && (
                        <span className={`text-[10px] font-black ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                        </span>
                    )}
                </div>
            </div>
            <div className={`p-3 rounded-2xl ${colors[color].split(' ').slice(1).join(' ')} group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
        </motion.div>
    );
};

export default AdminStatCard;

