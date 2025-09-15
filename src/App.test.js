import { render, screen } from '@testing-library/react';
import App from './App';

test('renders JCAS-NARCOS medication tracker', () => {
  render(<App />);
  
  // Check for the main heading
  const mainHeading = screen.getByRole('heading', { name: /JCAS-NARCOS/i, level: 1 });
  expect(mainHeading).toBeInTheDocument();
  
  // Check for version text
  const versionText = screen.getByText(/Medication Box Tracker v1.0.0/i);
  expect(versionText).toBeInTheDocument();
  
  // Check for medication form
  const addMedicationHeading = screen.getByRole('heading', { name: /Add New Medication/i, level: 2 });
  expect(addMedicationHeading).toBeInTheDocument();
  
  // Check for inventory section
  const inventoryHeading = screen.getByRole('heading', { name: /Medication Inventory/i, level: 2 });
  expect(inventoryHeading).toBeInTheDocument();
});
