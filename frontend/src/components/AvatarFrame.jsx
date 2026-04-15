const EMBED_URL = 'https://embed.liveavatar.com/v1/e987cfcc-321b-4dd1-9afb-9415aef257f3'

export default function AvatarFrame({ speaking }) {
  return (
    <div className={`relative w-full h-full rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
      speaking ? 'border-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.5)]' : 'border-[#1f2937]'
    }`}>
      {speaking && (
        <span className="absolute inset-0 rounded-2xl border-2 border-indigo-400 animate-ping opacity-20 z-10 pointer-events-none" />
      )}
      <iframe
        src={EMBED_URL}
        allow="microphone"
        title="Aegis LiveAvatar"
        className="w-full h-full border-0 block"
      />
      {/* Name badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
        <span className={`w-2 h-2 rounded-full ${speaking ? 'bg-indigo-400 animate-pulse' : 'bg-green-400'}`} />
        <span className="text-xs text-white font-medium">Aegis AI</span>
      </div>
    </div>
  )
}
