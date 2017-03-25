import os from 'os';
import diskusage from 'diskusage';

const path = os.platform() === 'win32' ? 'c:' : '/';

export default function health() {
  return new Promise((resolve, reject) => {
    diskusage.check(path, (err, info) => {
      if (err) {
        return reject(err);
      }

      resolve({
        description: 'Eureka JS Client',
        status: 'UP',
        diskSpace: {
          status: 'UP',
          total: info.total,
          free: info.free,
          threshold: info.total / 10,
        },
      });
    });
  });
}
