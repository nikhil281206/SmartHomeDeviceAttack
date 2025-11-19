import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface DeviceMetrics {
  device_id: string;
  cpu_usage: number;
  memory_usage: number;
  network_traffic: number;
  failed_auth_attempts: number;
}

interface AttackPattern {
  id: string;
  name: string;
  detection_rules: {
    threshold?: number;
    timeWindow?: number;
    trafficThreshold?: number;
    checkWhitelist?: boolean;
    portScanThreshold?: number;
    checkIntegrity?: boolean;
  };
  severity: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'POST') {
      const metrics: DeviceMetrics = await req.json();

      // Store the metrics
      const { error: metricsError } = await supabase
        .from('device_metrics')
        .insert(metrics);

      if (metricsError) {
        throw metricsError;
      }

      // Get active attack patterns
      const { data: patterns, error: patternsError } = await supabase
        .from('attack_patterns')
        .select('*')
        .eq('active', true);

      if (patternsError) {
        throw patternsError;
      }

      const detectedAttacks = [];

      // Analyze metrics against patterns
      for (const pattern of (patterns as AttackPattern[])) {
        const rules = pattern.detection_rules;

        // Brute Force Detection
        if (pattern.name === 'Brute Force Attack' && rules.threshold) {
          if (metrics.failed_auth_attempts >= rules.threshold) {
            detectedAttacks.push({
              device_id: metrics.device_id,
              event_type: 'brute_force',
              severity: pattern.severity,
              description: `Detected ${metrics.failed_auth_attempts} failed authentication attempts`,
              source_ip: 'unknown',
            });
          }
        }

        // DDoS Pattern Detection
        if (pattern.name === 'DDoS Pattern' && rules.trafficThreshold) {
          if (metrics.network_traffic >= rules.trafficThreshold) {
            detectedAttacks.push({
              device_id: metrics.device_id,
              event_type: 'ddos',
              severity: pattern.severity,
              description: `Unusual network traffic detected: ${metrics.network_traffic} bytes`,
              source_ip: 'unknown',
            });
          }
        }

        // High Resource Usage (potential compromise indicator)
        if (metrics.cpu_usage > 90 || metrics.memory_usage > 90) {
          detectedAttacks.push({
            device_id: metrics.device_id,
            event_type: 'resource_anomaly',
            severity: 'medium',
            description: `High resource usage detected - CPU: ${metrics.cpu_usage}%, Memory: ${metrics.memory_usage}%`,
            source_ip: 'unknown',
          });
        }
      }

      // Insert detected attacks
      if (detectedAttacks.length > 0) {
        const { error: eventsError } = await supabase
          .from('security_events')
          .insert(detectedAttacks);

        if (eventsError) {
          throw eventsError;
        }

        // Update device status to compromised
        await supabase
          .from('devices')
          .update({ status: 'compromised' })
          .eq('id', metrics.device_id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          attacks_detected: detectedAttacks.length,
          details: detectedAttacks,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // GET request - return recent security events
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('security_events')
        .select('*, devices(name, device_type)')
        .order('detected_at', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ events: data }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});