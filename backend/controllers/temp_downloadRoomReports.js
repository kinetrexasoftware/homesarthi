
export const downloadRoomReports = async (req, res) => {
    try {
        // 1. Fetch all rooms with owner populated
        // We want rooms that have an owner (owner field is required in schema, but good to check population)
        const rooms = await Room.find({})
            .populate('owner', 'name email phone')
            .lean();

        // 2. Fetch all reports related to rooms
        // We fetch all reports of type 'room' to map them to rooms efficiently
        const reports = await Report.find({ reportType: 'room' }).lean();

        // Create a map of roomID -> [comments]
        const reportMap = {};
        reports.forEach(report => {
            if (!reportMap[report.targetId]) {
                reportMap[report.targetId] = [];
            }
            // Include reason and any specific admin notes or description
            const comment = `${report.reason}: ${report.description || ''} (Status: ${report.status})`;
            reportMap[report.targetId].push(comment);
        });

        // 3. Prepare data for Excel
        const excelData = rooms.map(room => {
            const owner = room.owner || {};
            const roomReports = reportMap[room._id.toString()] || [];

            return {
                'Room ID': room._id.toString(),
                'Title': room.title,
                'Type': room.roomType,
                'Rent': room.rent?.amount,
                'City': room.location?.address?.city,
                'State': room.location?.address?.state,
                'Full Address': room.location?.address?.fullAddress || `${room.location?.address?.street || ''}, ${room.location?.address?.city || ''}`,
                'Owner Name': owner.name || 'N/A',
                'Owner Email': owner.email || 'N/A',
                'Owner Phone': owner.phone || 'N/A',
                'Verification Status': room.verification?.status,
                'Report Score': room.stats?.reportScore || 0,
                'Report Comments': roomReports.join('; \n') // Join multiple reports with newline
            };
        });

        // 4. Generate Excel
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Auto-adjust column widths (basic approximation)
        const colWidths = [
            { wch: 25 }, // ID
            { wch: 30 }, // Title
            { wch: 10 }, // Type
            { wch: 10 }, // Rent
            { wch: 15 }, // City
            { wch: 15 }, // State
            { wch: 40 }, // Address
            { wch: 20 }, // Owner Name
            { wch: 25 }, // Owner Email
            { wch: 15 }, // Owner Phone
            { wch: 15 }, // Status
            { wch: 12 }, // Score
            { wch: 50 }, // Comments
        ];
        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Room Reports');

        // 5. Send response
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="Room_Reports.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.send(buffer);

    } catch (error) {
        console.error('Download Report Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
