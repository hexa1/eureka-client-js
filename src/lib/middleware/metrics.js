import os from 'os';

export default function metrics() {
  const { heapTotal, heapUsed } = process.memoryUsage();
  const uptime = Math.round(process.uptime());
  const processors = os.cpus().length;
  const [loadAvg] = os.loadavg();

  return {
    mem: os.totalmem() / 1024,
    'mem.free': os.freemem() / 1024,
    processors,
    uptime,
    'instance.uptime': uptime,
    'systemload.average': loadAvg,
    heap: heapTotal,
    'heap.used': heapUsed,
  };
}
