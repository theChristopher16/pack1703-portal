import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Database, Wifi, WifiOff, Clock, CheckCircle, XCircle } from 'lucide-react';
import { firestoreService } from '../../services/firestore';
import configService from '../../services/configService';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface ConnectionStatus {
  name: string;
  status: 'online' | 'offline' | 'checking';
  responseTime?: number;
  lastChecked: Date;
  error?: string;
}

interface DatabaseMonitorProps {
  className?: string;
}

const DatabaseMonitor: React.FC<DatabaseMonitorProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connections, setConnections] = useState<ConnectionStatus[]>([
    {
      name: 'Firestore Database',
      status: 'checking',
      lastChecked: new Date()
    },
    {
      name: 'Configuration Service',
      status: 'checking',
      lastChecked: new Date()
    },
    {
      name: 'Events Collection',
      status: 'checking',
      lastChecked: new Date()
    },
    {
      name: 'Announcements Collection',
      status: 'checking',
      lastChecked: new Date()
    },
    {
      name: 'Locations Collection',
      status: 'checking',
      lastChecked: new Date()
    },
    {
      name: 'Seasons Collection',
      status: 'checking',
      lastChecked: new Date()
    }
  ]);

  const checkConnection = async (index: number, testFunction: () => Promise<any>) => {
    const startTime = Date.now();
    try {
      await testFunction();
      const responseTime = Date.now() - startTime;
      setConnections(prev => prev.map((conn, i) => 
        i === index ? {
          ...conn,
          status: 'online' as const,
          responseTime,
          lastChecked: new Date(),
          error: undefined
        } : conn
      ));
    } catch (error) {
      setConnections(prev => prev.map((conn, i) => 
        i === index ? {
          ...conn,
          status: 'offline' as const,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        } : conn
      ));
    }
  };

  const checkAllConnections = async () => {
    // Check Firestore Database
    await checkConnection(0, async () => {
      const testRef = collection(db, '_test_connection');
      await getDocs(query(testRef, limit(1)));
    });

    // Check Configuration Service
    await checkConnection(1, async () => {
      await configService.getConfigValue('app.name');
    });

    // Check Events Collection
    await checkConnection(2, async () => {
      await firestoreService.getEvents();
    });

    // Check Announcements Collection
    await checkConnection(3, async () => {
      await firestoreService.getAnnouncements();
    });

    // Check Locations Collection
    await checkConnection(4, async () => {
      await firestoreService.getLocations();
    });

    // Check Seasons Collection
    await checkConnection(5, async () => {
      await firestoreService.getSeasons();
    });
  };

  useEffect(() => {
    checkAllConnections();
    
    // Check connections every 30 seconds
    const interval = setInterval(checkAllConnections, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ConnectionStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: ConnectionStatus['status']) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'offline':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'checking':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const onlineCount = connections.filter(c => c.status === 'online').length;
  const totalCount = connections.length;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <Database className="w-5 h-5 text-gray-600" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Database Connections</h3>
            <p className="text-xs text-gray-500">
              {onlineCount}/{totalCount} online • Last checked: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(onlineCount === totalCount ? 'online' : onlineCount === 0 ? 'offline' : 'checking')}`}>
            {onlineCount === totalCount ? 'All Online' : onlineCount === 0 ? 'All Offline' : 'Partial'}
          </div>
          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-3">
          {connections.map((connection, index) => (
            <div key={connection.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(connection.status)}
                <div>
                  <p className="text-sm font-medium text-gray-900">{connection.name}</p>
                  <p className="text-xs text-gray-500">
                    Last checked: {connection.lastChecked.toLocaleTimeString()}
                    {connection.responseTime && ` • ${connection.responseTime}ms`}
                  </p>
                  {connection.error && (
                    <p className="text-xs text-red-600 mt-1">{connection.error}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => checkConnection(index, async () => {
                  switch (index) {
                    case 0:
                      const testRef = collection(db, '_test_connection');
                      await getDocs(query(testRef, limit(1)));
                      break;
                    case 1:
                      await configService.getConfigValue('app.name');
                      break;
                    case 2:
                      await firestoreService.getEvents();
                      break;
                    case 3:
                      await firestoreService.getAnnouncements();
                      break;
                    case 4:
                      await firestoreService.getLocations();
                      break;
                    case 5:
                      await firestoreService.getSeasons();
                      break;
                  }
                })}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Test
              </button>
            </div>
          ))}
          
          <div className="pt-3 border-t border-gray-200">
            <button
              onClick={checkAllConnections}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh All Connections
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseMonitor;
