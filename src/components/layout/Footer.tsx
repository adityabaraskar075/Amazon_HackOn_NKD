export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground py-6 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Q-SmartPay. All rights reserved.
        </p>
        <p className="text-xs mt-1">
          Fraud detection powered by GNN technology.
        </p>
      </div>
    </footer>
  );
}
