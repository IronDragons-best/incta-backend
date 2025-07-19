export class MockDevicesRepository {
  findAll = jest.fn();
  deleteDevice = jest.fn();
  insertNewDevice = jest.fn();
  deleteDeviceById = jest.fn();
  updateDeviceById = jest.fn();
  findSessionBySessionIdAndUserId = jest.fn();
  save = jest.fn();
}

export class MockDevicesQueryRepository {
  findByUserId = jest.fn();
  findActiveDevices = jest.fn();
}
