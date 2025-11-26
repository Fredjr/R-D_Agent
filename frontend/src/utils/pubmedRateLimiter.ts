/**
 * PubMed API Rate Limiter with Exponential Backoff
 * 
 * PubMed E-utilities rate limits:
 * - Without API key: 3 requests per second
 * - With API key: 10 requests per second
 * 
 * This utility implements:
 * 1. Request queuing to prevent exceeding rate limits
 * 2. Exponential backoff retry logic for 429 errors
 * 3. Request deduplication to avoid redundant API calls
 */

interface QueuedRequest {
  url: string;
  options?: RequestInit;
  resolve: (value: Response) => void;
  reject: (reason: any) => void;
  retryCount: number;
  timestamp: number;
}

class PubMedRateLimiter {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minInterval = 350; // ~3 requests per second (conservative)
  private readonly maxRetries = 3;
  private readonly baseDelay = 1000; // 1 second base delay for retries
  
  // Cache for in-flight requests to prevent duplicates
  private inFlightRequests = new Map<string, Promise<Response>>();

  /**
   * Fetch with rate limiting and retry logic
   */
  async fetch(url: string, options?: RequestInit): Promise<Response> {
    // Check if this request is already in flight
    const cacheKey = `${url}:${JSON.stringify(options || {})}`;
    const existingRequest = this.inFlightRequests.get(cacheKey);
    if (existingRequest) {
      console.log('🔄 Reusing in-flight request:', url);
      return existingRequest;
    }

    // Create a new promise for this request
    const requestPromise = new Promise<Response>((resolve, reject) => {
      this.queue.push({
        url,
        options,
        resolve,
        reject,
        retryCount: 0,
        timestamp: Date.now()
      });
      
      // Start processing if not already running
      if (!this.processing) {
        this.processQueue();
      }
    });

    // Cache the promise
    this.inFlightRequests.set(cacheKey, requestPromise);

    // Clean up cache after request completes
    requestPromise.finally(() => {
      this.inFlightRequests.delete(cacheKey);
    });

    return requestPromise;
  }

  /**
   * Process the request queue with rate limiting
   */
  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      
      // Wait for rate limit interval
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minInterval) {
        const waitTime = this.minInterval - timeSinceLastRequest;
        console.log(`⏳ Rate limiting: waiting ${waitTime}ms before next request`);
        await this.sleep(waitTime);
      }

      try {
        this.lastRequestTime = Date.now();
        const response = await fetch(request.url, request.options);

        // Handle 429 Too Many Requests with exponential backoff
        if (response.status === 429) {
          if (request.retryCount < this.maxRetries) {
            const delay = this.baseDelay * Math.pow(2, request.retryCount);
            console.warn(`⚠️ 429 Too Many Requests. Retrying in ${delay}ms (attempt ${request.retryCount + 1}/${this.maxRetries})`);
            
            // Wait with exponential backoff
            await this.sleep(delay);
            
            // Re-queue the request with incremented retry count
            request.retryCount++;
            this.queue.unshift(request); // Add to front of queue for immediate retry
            continue;
          } else {
            console.error(`❌ Max retries (${this.maxRetries}) exceeded for: ${request.url}`);
            request.reject(new Error(`Rate limit exceeded after ${this.maxRetries} retries`));
            continue;
          }
        }

        // Success - resolve the promise
        request.resolve(response);
      } catch (error) {
        console.error('❌ Error in rate-limited fetch:', error);
        request.reject(error);
      }
    }

    this.processing = false;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue status for debugging
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      inFlightRequests: this.inFlightRequests.size,
      lastRequestTime: this.lastRequestTime
    };
  }
}

// Export singleton instance
export const pubmedRateLimiter = new PubMedRateLimiter();

