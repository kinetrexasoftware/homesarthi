import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const FreeMapView = ({
    latitude,
    longitude,
    zoom = 13,
    markers = [],
    height = 300,
    showCircle = false,
    circleRadius = 500,
    onMarkerClick = null,
    selectedMarkerId = null,
    fitBounds = false
}) => {
    // Generate custom price markers with HTML
    const markersHtml = markers.map((m, index) => {
        const price = m.price || m.rent || 'N/A';
        const isSelected = selectedMarkerId === index;

        return `
        // Marker ${index}
        var priceIcon${index} = L.divIcon({
            html: '<div style="background-color: ${isSelected ? '#3B82F6' : '#10B981'}; color: white; padding: 6px 10px; border-radius: 12px; font-weight: 900; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'}; white-space: nowrap;">₹${price}</div>',
            className: 'price-marker',
            iconSize: [60, 30],
            iconAnchor: [30, 15]
        });
        
        var marker${index} = L.marker([${m.latitude}, ${m.longitude}], { 
            icon: priceIcon${index},
            zIndexOffset: ${isSelected ? 1000 : 0}
        }).addTo(map);
        
        marker${index}.bindPopup(\`
            <div style="font-family: system-ui, -apple-system; min-width: 160px;">
                <div style="font-weight: 900; font-size: 13px; color: #1F2937; margin-bottom: 4px;">${m.title || 'Room'}</div>
                <div style="font-size: 12px; font-weight: 700; color: #10B981; margin-bottom: 4px;">₹${price}</div>
                <div style="font-size: 10px; color: #6B7280;">${m.subtitle || 'Click to view details'}</div>
            </div>
        \`);
        
        ${onMarkerClick ? `marker${index}.on('click', function() { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', index: ${index} })); });` : ''}
        `;
    }).join('\n');

    // Circle HTML
    const circleHtml = showCircle ? `
        L.circle([${latitude}, ${longitude}], {
            color: '#2563EB',
            fillColor: '#3B82F6',
            fillOpacity: 0.1,
            radius: ${circleRadius}
        }).addTo(map);
    ` : '';

    // Fit bounds to show all markers
    const fitBoundsHtml = fitBounds && markers.length > 0 ? `
        setTimeout(function() {
            var bounds = L.latLngBounds([
                ${markers.map(m => `[${m.latitude}, ${m.longitude}]`).join(',\n                ')}
            ]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }, 600);
    ` : '';

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                body { margin: 0; padding: 0; }
                #map { height: 100vh; width: 100vw; }
                .leaflet-control-attribution { display: none; }
                .price-marker { 
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }
                .leaflet-popup-content-wrapper {
                    border-radius: 16px;
                    padding: 8px;
                }
                .leaflet-popup-tip {
                    display: none;
                }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                var map = L.map('map', {
                    zoomControl: true,
                    attributionControl: false
                }).setView([${latitude}, ${longitude}], ${zoom});
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: ''
                }).addTo(map);

                ${markersHtml}
                ${circleHtml}
                ${fitBoundsHtml}

                // Force layout recalculation
                setTimeout(function() {
                    map.invalidateSize();
                }, 500);
            </script>
        </body>
        </html>
    `;

    const handleMessage = (event) => {
        if (onMarkerClick) {
            try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'markerClick') {
                    onMarkerClick(data.index);
                }
            } catch (e) {
                console.log('Error parsing message:', e);
            }
        }
    };

    return (
        <View style={[styles.container, { height }]}>
            <WebView
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                onMessage={handleMessage}
                renderLoading={() => (
                    <View style={styles.loading}>
                        <ActivityIndicator color="#2563EB" size="large" />
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        overflow: 'hidden',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loading: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
    }
});

export default FreeMapView;
