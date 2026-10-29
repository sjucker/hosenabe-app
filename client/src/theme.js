import {createTheme} from "@mui/material/styles";

// Design tokens shared by components that draw outside the MUI palette (felt table, coins, ...)
export const tokens = {
    feltLight: '#2f7d4f',
    feltDark: '#17462c',
    feltText: '#f3efe2',
    feltTextMuted: 'rgba(243, 239, 226, 0.72)',
    wood: '#5b3a21',
    woodDark: '#3b2414',
    gold: '#e8b33a',
    goldDark: '#b9851a',
    header: '#173f2a',
    displayFont: '"Fraunces", Georgia, "Times New Roman", serif'
};

export function createAppTheme(useDarkMode) {
    const headingStyle = {fontFamily: tokens.displayFont, fontWeight: 700, letterSpacing: '-0.01em'};

    const theme = createTheme({
        palette: {
            mode: useDarkMode ? 'dark' : 'light',
            primary: {
                main: useDarkMode ? '#d9483b' : '#c0392b'
            },
            secondary: {
                main: tokens.gold,
                dark: tokens.goldDark,
                contrastText: '#2b1d00'
            },
            background: useDarkMode
                ? {default: '#121513', paper: '#1c211e'}
                : {default: '#f3eee4', paper: '#fffdf8'}
        },
        shape: {
            borderRadius: 12
        },
        typography: {
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            h1: headingStyle,
            h2: headingStyle,
            h3: headingStyle,
            h4: headingStyle,
            h5: headingStyle,
            h6: {...headingStyle, fontWeight: 600},
            button: {
                textTransform: 'none',
                fontWeight: 600,
                letterSpacing: '0.01em'
            },
            overline: {
                fontWeight: 600,
                letterSpacing: '0.12em'
            }
        },
        components: {
            MuiButton: {
                defaultProps: {
                    disableElevation: true
                },
                styleOverrides: {
                    root: {
                        borderRadius: 10
                    },
                    sizeLarge: {
                        padding: '10px 22px',
                        fontSize: '1rem'
                    }
                }
            },
            MuiPaper: {
                styleOverrides: {
                    // Dark mode would otherwise lighten elevated papers with a gradient overlay
                    root: {
                        backgroundImage: 'none'
                    },
                    rounded: {
                        borderRadius: 16
                    }
                }
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        borderRadius: 20
                    }
                }
            }
        }
    });

    // Phones: a slimmer app bar leaves more room for the game
    theme.components.MuiToolbar = {
        styleOverrides: {
            regular: {
                [theme.breakpoints.down('sm')]: {
                    minHeight: 48
                }
            }
        }
    };

    return theme;
}
