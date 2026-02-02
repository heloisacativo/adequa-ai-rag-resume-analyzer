interface InputChatProps {
  label?: string;
  placeholder?: string;
}

export default function InputChat({ label, placeholder = "Escreva uma mensagem..." }: InputChatProps) {
  return (
    <div className="m-2 flex gap-1 flex-col">
      {label && <span className="font-bold mr-2">{label}</span>}
      <input
        type="text"
        className="input input-bordered w-full h-14"
        placeholder={placeholder}
      />
    </div>
  );
}