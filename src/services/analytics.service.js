import { Analytics } from '../models/analytics.model.js';
import { Url } from '../models/url.model.js';
import { getRecentDays } from '../utils/date.utils.js';
import { CacheService } from './cache.service.js';

export class AnalyticsService {
  static async getUrlAnalytics(urlId, startDate) {
    const cacheKey = CacheService.generateKey('url-analytics', urlId.toString());
    
    return CacheService.getOrSet(cacheKey, async () => {
      const analytics = await Analytics.find({
        urlId,
        timestamp: { $gte: startDate }
      });

      return {
        clicksByDate: await this.getClicksByDate(urlId, startDate),
        osStats: this.calculateOSStats(analytics),
        deviceStats: this.calculateDeviceStats(analytics),
        uniqueVisitors: new Set(analytics.map(a => a.ipAddress)).size
      };
    }, 300); // Cache for 5 minutes
  }

  static async getTopicAnalytics(topic, startDate) {
    const cacheKey = CacheService.generateKey('topic-analytics', topic);
    
    return CacheService.getOrSet(cacheKey, async () => {
      const urls = await Url.find({ topic });
      const urlIds = urls.map(url => url._id);
      
      const analytics = await Analytics.find({
        urlId: { $in: urlIds },
        timestamp: { $gte: startDate }
      });

      const uniqueIPs = new Set(analytics.map(a => a.ipAddress));
      const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);

      return {
        totalClicks,
        uniqueClicks: uniqueIPs.size,
        clicksByDate: await this.getTopicClicksByDate(urlIds, startDate),
        urls: await this.getUrlsAnalytics(urls, analytics),
        osStats: this.calculateOSStats(analytics),
        deviceStats: this.calculateDeviceStats(analytics)
      };
    }, 300);
  }

  static async getClicksByDate(urlId, startDate) {
    const recentDays = getRecentDays(7);
    
    const clicksByDay = await Analytics.aggregate([
      {
        $match: {
          urlId: urlId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: "$ipAddress" }
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          uniqueUsers: { $size: "$uniqueUsers" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return recentDays.map(date => ({
      date,
      clicks: clicksByDay.find(day => day._id === date)?.count || 0,
      uniqueUsers: clicksByDay.find(day => day._id === date)?.uniqueUsers || 0
    }));
  }

   static calculateOSStats(analytics) {
    const osMap = new Map();

    analytics.forEach(visit => {
      const os = visit.userAgent.os;
      if (!osMap.has(os)) {
        osMap.set(os, {
          osName: os,
          uniqueClicks: new Set(),
          uniqueUsers: new Set(),
          browserVersions: new Map()
        });
      }
      
      const stats = osMap.get(os);
      stats.uniqueClicks.add(visit.ipAddress);
      stats.uniqueUsers.add(visit.ipAddress);
      
      // Track browser versions
      const browserVersion = `${visit.userAgent.browser} ${visit.userAgent.version}`;
      if (!stats.browserVersions.has(browserVersion)) {
        stats.browserVersions.set(browserVersion, new Set());
      }
      stats.browserVersions.get(browserVersion).add(visit.ipAddress);
    });

    return Array.from(osMap.values()).map(stat => ({
      osName: stat.osName,
      uniqueClicks: stat.uniqueClicks.size,
      uniqueUsers: stat.uniqueUsers.size,
      browsers: Array.from(stat.browserVersions.entries()).map(([browser, users]) => ({
        browser,
        users: users.size
      }))
    }));
  }

   static calculateDeviceStats(analytics) {
    const deviceMap = new Map();

    analytics.forEach(visit => {
      const device = visit.userAgent.device;
      if (!deviceMap.has(device)) {
        deviceMap.set(device, {
          deviceName: device,
          uniqueClicks: new Set(),
          uniqueUsers: new Set(),
          models: new Map()
        });
      }
      
      const stats = deviceMap.get(device);
      stats.uniqueClicks.add(visit.ipAddress);
      stats.uniqueUsers.add(visit.ipAddress);
      
      // Track device models
      if (visit.userAgent.model) {
        if (!stats.models.has(visit.userAgent.model)) {
          stats.models.set(visit.userAgent.model, new Set());
        }
        stats.models.get(visit.userAgent.model).add(visit.ipAddress);
      }
    });

    return Array.from(deviceMap.values()).map(stat => ({
      deviceName: stat.deviceName,
      uniqueClicks: stat.uniqueClicks.size,
      uniqueUsers: stat.uniqueUsers.size,
      models: Array.from(stat.models.entries()).map(([model, users]) => ({
        model,
        users: users.size
      }))
    }));
  }
}