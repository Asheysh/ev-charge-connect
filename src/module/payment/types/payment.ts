export interface Station {
  id: string
  name: string
  location: string
  slotNumber: number
}

export interface Charger {
  type: 'AC' | 'DC'
  speed: number
  ratePerUnit: number
  platformFee: number
}

export interface Vehicle {
  name: string
  registrationNumber: string
}

export interface SessionData {
  station: Station
  charger: Charger
  vehicle: Vehicle
  preAuthAmount: number
  startTime?: Date
  endTime?: Date
  kWhUsed?: number
  totalAmount?: number
}