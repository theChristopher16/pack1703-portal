# Ecology Dashboard Component

## Overview

The Ecology Dashboard is an educational tool designed for Pack 1703 scouts to learn about environmental monitoring through real-time sensor data visualization. It provides an interactive interface for viewing various environmental metrics with educational content to help kids understand the data.

## Features

### 🌡️ Sensor Monitoring
- **Temperature**: Real-time temperature readings with educational context
- **Humidity**: Air moisture levels with plant care information
- **Pressure**: Atmospheric pressure monitoring
- **Air Quality**: AQI readings for environmental health
- **Light Level**: Sunlight intensity measurements
- **Soil Moisture**: Ground moisture for garden care

### 📊 Data Visualization
- **Real-time Charts**: Line and area charts showing sensor trends
- **Live Updates**: Data refreshes every 5 seconds when in live mode
- **Historical Data**: View data over different time periods
- **Interactive Tooltips**: Hover for detailed readings

### 🎓 Educational Content
- **Kid-Friendly Explanations**: Age-appropriate descriptions of each sensor
- **Plant Care Tips**: How environmental conditions affect plant growth
- **Science Learning**: Understanding weather patterns and environmental factors

### 🔧 Interactive Features
- **Live Mode Toggle**: Start/stop real-time data updates
- **Refresh Button**: Manually refresh sensor readings
- **Raw Data View**: Toggle to see actual sensor values
- **Responsive Design**: Works on desktop, tablet, and mobile

## Technical Implementation

### Dependencies
- **Recharts**: For data visualization and charting
- **Lucide React**: For icons and visual elements
- **React Hooks**: For state management and real-time updates

### Mock Data
Currently uses mock data generation for demonstration purposes. In production, this would connect to:
- ESP32 sensors for temperature, humidity, pressure
- Air quality sensors for AQI readings
- Light sensors for sun exposure
- Soil moisture sensors for garden monitoring

### Role-Based Access
- **Parent and Above**: Full access to all features
- **Educational Focus**: Content designed for scout learning
- **Safe Environment**: No sensitive data or inappropriate content

## Usage

1. Navigate to `/ecology` in the Pack 1703 portal
2. View real-time sensor readings in the dashboard cards
3. Observe trends in the temperature and humidity charts
4. Read educational content to understand what the data means
5. Toggle live mode to pause/start real-time updates
6. Use "Show Data" to view raw sensor readings

## Future Enhancements

- **Real Sensor Integration**: Connect to actual ESP32 and other sensors
- **Historical Data Storage**: Save data to Firebase for long-term analysis
- **Alerts and Notifications**: Notify when conditions need attention
- **Weather Integration**: Compare sensor data with local weather
- **Plant Database**: Connect readings to specific plant care needs
- **Gamification**: Add badges and achievements for learning milestones

## Educational Value

This component helps scouts learn:
- **Environmental Science**: How different factors affect plant growth
- **Data Analysis**: Reading and interpreting charts and graphs
- **Technology**: Understanding how sensors collect data
- **Observation Skills**: Noticing patterns and changes over time
- **Problem Solving**: Connecting data to real-world applications

The dashboard transforms raw sensor data into an engaging, educational experience that makes science and technology accessible and fun for young scouts.
