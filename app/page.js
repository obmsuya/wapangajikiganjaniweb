import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-between min-h-screen p-24">
      <h1 className="text-4xl font-bold">Wapangaji Kiganjani</h1>
      <p className="mt-4 text-lg">Property Management System for Landlords</p>
      <Image
        src="/logo.png"
        alt="Logo"
        width={150}
        height={150}
        className="mt-8"
      />
    </main>
  );
}
