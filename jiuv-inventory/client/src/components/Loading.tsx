interface LoadingProps {
  text?: string;
}

export default function Loading({ text = '加载中...' }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-cyber-gold/30 border-t-cyber-gold rounded-full animate-spin" />
      <p className="mt-3 text-sm text-cyber-text-dim">{text}</p>
    </div>
  );
}
