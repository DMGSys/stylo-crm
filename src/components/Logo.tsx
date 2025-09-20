import Image from "next/image"

interface LogoProps {
  withSlogan?: boolean
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export default function Logo({ withSlogan = false, size = 'medium', className = '' }: LogoProps) {
  const sizes = {
    small: { width: 100, height: 100, fontSize: '14px' },
    medium: { width: 150, height: 150, fontSize: '16px' },
    large: { width: 200, height: 200, fontSize: '18px' }
  }

  const currentSize = sizes[size]

  return (
    <div className={`text-center ${className}`}>
      <Image
        src="/logo/stylo-logo.png"
        alt="Stylo Logo"
        width={currentSize.width}
        height={currentSize.height}
        className="mx-auto"
      />
      {withSlogan && (
        <p style={{
          fontFamily: "Poppins, sans-serif",
          fontSize: currentSize.fontSize,
          marginTop: "8px",
          color: "#FFFFFF"
        }}>
          Reserva, cuidate, brillá
        </p>
      )}
    </div>
  )
}
