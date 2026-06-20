import { render, screen } from '@testing-library/react';
import { SeatInfo } from './SeatInfo.tsx';

describe('SeatInfo', () => {
  it('shows the seat wind label and non-dealer role', () => {
    render(<SeatInfo seatWind="south" />);
    expect(screen.getByText('自風')).toBeInTheDocument();
    expect(screen.getByText('子')).toBeInTheDocument();
  });

  it('marks east as dealer (親)', () => {
    render(<SeatInfo seatWind="east" />);
    expect(screen.getByText('親')).toBeInTheDocument();
  });
});
