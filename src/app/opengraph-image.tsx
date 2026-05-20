import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Ghana Appliances - Quality Electrical Appliances in Ghana'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ background: 'linear-gradient(to bottom right, #1a1a2e, #16213e)', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 72, fontWeight: 'bold', color: '#f59e0b', marginBottom: 20 }}>Ghana Appliances</div>
        <div style={{ fontSize: 32, color: '#e5e7eb', marginBottom: 40 }}>Quality Electrical Appliances · Cash on Delivery</div>
        <div style={{ fontSize: 24, color: '#9ca3af' }}>TVs · Air Conditioners · Refrigerators · Washing Machines</div>
        <div style={{ position: 'absolute', bottom: 40, fontSize: 20, color: '#6b7280' }}>ghanaappliance.cc</div>
      </div>
    ),
    { ...size }
  )
}

