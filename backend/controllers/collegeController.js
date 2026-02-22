import College from '../models/College.js';
import axios from 'axios';
import Fuse from 'fuse.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

/**
 * @desc    Search colleges and locations (Internal + OSM)
 * @route   GET /api/colleges/search
 */
export const searchColleges = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const cacheKey = `search_${q.toLowerCase().trim()}`;
        const cachedResults = cache.get(cacheKey);
        if (cachedResults) return res.json({ success: true, data: cachedResults, source: 'cache' });

        // 1. Search Internal DB
        // We use regex for basic match and popularity ranking
        const internalColleges = await College.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { aliases: { $regex: q, $options: 'i' } }
            ]
        }).limit(10).sort({ verified: -1, popularityScore: -1 });

        // 2. OSM Fallback (Nominatim)
        let osmResults = [];
        try {
            const osmResponse = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    q: q,
                    format: 'json',
                    addressdetails: 1,
                    limit: 5,
                    countrycodes: 'in' // Restrict to India
                },
                headers: {
                    'User-Agent': 'RoomSarthi-College-Search/1.0'
                }
            });

            osmResults = osmResponse.data.map(item => ({
                name: item.display_name.split(',')[0],
                subTitle: item.display_name.split(',').slice(1, 3).join(',').trim(),
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(item.lon), parseFloat(item.lat)]
                },
                type: item.type === 'university' || item.type === 'college' ? 'college' : 'location',
                verified: false,
                source: 'osm'
            }));
        } catch (error) {
            console.error('OSM Search Error:', error.message);
        }

        // 3. Merge & Fuzzy Ranking
        const merged = [
            ...internalColleges.map(c => ({
                id: c._id,
                name: c.name,
                subTitle: `${c.address.city}, ${c.address.state}`,
                location: c.location,
                type: c.type,
                verified: c.verified,
                source: 'internal'
            })),
            ...osmResults
        ];

        // Unique by coordinates to avoid overlap
        const uniqueResults = [];
        const seen = new Set();
        for (const item of merged) {
            const key = `${item.location.coordinates[0].toFixed(4)},${item.location.coordinates[1].toFixed(4)}`;
            if (!seen.has(key)) {
                uniqueResults.push(item);
                seen.add(key);
            }
        }

        // 4. Fuzzy Rank with Fuse.js for typo tolerance
        const fuse = new Fuse(uniqueResults, {
            keys: ['name', 'subTitle'],
            threshold: 0.4,
            includeScore: true
        });

        const finalResults = fuse.search(q).map(r => ({
            ...r.item,
            matchScore: r.score
        }));

        // If no fuzzy matches, return unique results directly
        const output = finalResults.length > 0 ? finalResults.map(r => {
            const { matchScore, ...items } = r;
            return items;
        }) : uniqueResults.slice(0, 10);

        cache.set(cacheKey, output);
        res.json({ success: true, data: output });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Initialize/Seed Colleges from JSON (Internal Helper)
 */
export const seedColleges = async (req, res) => {
    try {
        const count = await College.countDocuments();
        if (count > 0 && !req.query.force) {
            return res.json({ success: true, message: 'Colleges already seeded' });
        }

        const fs = await import('fs');
        const path = await import('path');
        const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/colleges.json'), 'utf-8'));

        const formatted = data.map(c => ({
            name: c.name,
            location: {
                type: 'Point',
                coordinates: [c.coordinates.longitude, c.coordinates.latitude]
            },
            address: {
                city: c.city,
                state: 'Uttar Pradesh' // Defaulting based on provided data
            },
            type: 'college',
            verified: true,
            popularityScore: Math.floor(Math.random() * 100)
        }));

        await College.deleteMany({});
        await College.insertMany(formatted);

        res.json({ success: true, message: `Seeded ${formatted.length} colleges` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
