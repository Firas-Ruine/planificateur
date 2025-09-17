export function AppHeader() {
  return (
    <header className="bg-indigo-700 text-white p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Planificateur</h1>
          <p className="text-indigo-200">Gestion des objectifs et tâches</p>
        </div>
        <div className="h-24 w-24 rounded-lg flex items-center justify-center overflow-hidden">
          <img
            src="https://arveatest.s3.eu-west-3.amazonaws.com/Maisonduweb.png"
            alt="Maison du Web Logo"
            className="w-20 h-20 object-contain"
          />
        </div>
      </div>
    </header>
  )
}
