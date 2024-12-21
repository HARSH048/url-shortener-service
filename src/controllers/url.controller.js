import { nanoid } from "nanoid";
import { Url } from "../models/url.model.js";
import { validateUrl } from "../utils/url.utils.js";
import { ApiError } from "../utils/api-error.js";
import { AnalyticsService } from "../services/analytics.service.js";
import { CacheService } from "../services/cache.service.js";

export const redirectToLongUrl = async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const cacheKey = CacheService.generateKey("url-redirect", shortCode);

    const url = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const url = await Url.findOneAndUpdate(
          { shortCode },
          { $inc: { clicks: 1 } },
          { new: true }
        );
        return url;
      },
      3600
    ); // Cache for 1 hour

    if (!url) {
      throw new ApiError(404, "URL not found");
    }

    // Track analytics asynchronously
    AnalyticsService.getUrlAnalytics(url._id, new Date()).catch((err) => {
      console.error("Analytics tracking error:", err);
    });

    // Invalidate analytics cache
    await CacheService.del(
      CacheService.generateKey("url-analytics", url._id.toString())
    );

    res.status(200).json({
      longUrl: url.longUrl
    });
  } catch (error) {
    next(error);
  }
};

export const createShortUrl = async (req, res, next) => {
  try {
    const { longUrl, customAlias, topic } = req.body;
    const userId = req?.user?._id;

    if (!validateUrl(longUrl)) {
      throw new ApiError(400, "Invalid URL format");
    }

    let shortCode = customAlias;

    if (shortCode) {
      const existing = await Url.findOne({ shortCode });
      if (existing) {
        throw new ApiError(409, "Custom alias already in use");
      }
    } else {
      shortCode = nanoid(8);
    }

    const url = await Url.create({
      userId: userId || '655f3122574257bfc8209944',
      longUrl,
      shortCode,
      topic: topic || "other",
    });

    const shortUrl = `${process.env.BASE_URL}/api/url/${url.shortCode}`;

    res.status(201).json({
      shortUrl,
      shortCode: url.shortCode,
      createdAt: url.createdAt,
    });
  } catch (error) {
    next(error);
  }
};
