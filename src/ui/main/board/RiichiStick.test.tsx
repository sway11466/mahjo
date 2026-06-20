import { render, screen } from '@testing-library/react';
import { RiichiStick } from './RiichiStick.tsx';

describe('RiichiStick', () => {
  it('renders a labelled 1000-point stick', () => {
    render(<RiichiStick />);
    expect(
      screen.getByRole('img', { name: 'リーチ（千点棒）' }),
    ).toBeInTheDocument();
  });
});
