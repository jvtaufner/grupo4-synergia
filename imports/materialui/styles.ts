/*!

 =========================================================
 * Material Dashboard React - v1.0.0 based on Material Dashboard - v1.2.0
 =========================================================

 * Product Page: http://www.creative-tim.com/product/material-dashboard-react
 * Copyright 2018 Creative Tim (http://www.creative-tim.com)
 * Licensed under MIT (https://github.com/creativetimofficial/material-dashboard-react/blob/master/LICENSE.md)

 =========================================================

 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 */

import { isMobile } from '/imports/libs/deviceVerify';


// Cores principais
const primaryColor = '#5a9902';
const primaryBlue = '#0071bb';
const primaryGreen = '#00b4c2';
const primaryGradient = `linear-gradient(to right, ${ primaryBlue } 0%, ${ primaryGreen } 100%)`;
const primaryGradientOnHover = `linear-gradient(to left, ${ primaryBlue } 0%, ${ primaryGreen } 100%)`;
const secondaryColor = '#3e6b01';
const secondaryColorOnHover = 'rgba(0, 0, 0, 0.15)';

// Cores de texto
const textPrimary = '#000000';
const textSecondary = '#404040';
const textDisabled = '#888888';
const textAuxiliar = '#888888';
const textWhite = '#ffffff';

// Cores de elementos e superfícies
const supportColor = '#c4c4c4';
const disabledBackground = '#e6e6e6';
const backgroundColor = '#f2f2f2';
const surfaceColor = '#ffffff';
const infoBackground = '#daf0ff';

// Cores relacionadas às dimensões
const dimAtores = '#f1667c';
const dimCultura = '#7e78b8';
const dimEstrutura = '#44c8f5';
const dimPoliticas = '#fbb040';
const dimRecursos = '#42c1c7';

const dimAtoresSuave = 'rgba(241,102,124,0.35)';
const dimCulturaSuave = 'rgba(126,120,184,0.35)';
const dimEstruturaSuave = 'rgba(68,200,245,0.35)';
const dimPoliticasSuave = 'rgba(251,176,64,0.35)';
const dimRecursosSuave = 'rgba(66,193,199,0.35)';

const dimGradient = `linear-gradient(to right, ${ dimAtores } 0%, ${ dimCultura } 25%, ${ dimEstrutura } 50%, ${ dimRecursos } 75%, ${ dimPoliticas } 100%)`;
const dimAngularGradient = `conic-gradient(${ dimAtoresSuave }, ${ dimCulturaSuave }, ${ dimEstruturaSuave }, ${ dimRecursosSuave }, ${ dimPoliticasSuave }, ${ dimAtoresSuave })`;

const errorColor= '#FF3858';

// Messages (Boilerplate)
const warningColor = '#ff9800';
const dangerColor = '#f55a4e';
const successColor = '#4caf50';
const infoColor = '#00acc1';
const textColorMessages = '#002e07';
const textColorGray = '#999999';

// Background Color
const systemBackgroundColor = '#eeeeee';
const pageBackgroundColor = '#FFF';





// Tipografia
const h1 = {
    fontFamily: "'M PLUS Rounded 1c', sans-serif",
    fontSize: isMobile ? '2.25rem' : '3rem', //36px ou 48px
    fontWeight: 800,
    lineHeight: 'normal',
};
const h2 = {
    fontFamily: "'M PLUS Rounded 1c', sans-serif",
    fontSize: isMobile ? '1.75rem' : '2.25rem', //28px ou 36px
    fontWeight: 800,
    lineHeight: 'normal',
};
const h3 = {
    fontFamily: "'M PLUS Rounded 1c', sans-serif",
    fontSize: isMobile ? '1.5rem' : '1.75rem', //24px ou 28px
    fontWeight: 800,
    lineHeight: 'normal',
};
const h4 = {
    fontSize: isMobile ? '1.5rem' : '1.75rem', //24px ou 28px
    fontWeight: 400,
    lineHeight: 'normal',
};
const h5 = {
    fontFamily: "'M PLUS Rounded 1c', sans-serif",
    fontSize: isMobile ? '1.25rem' : '1.5rem', //20px ou 24px
    fontWeight: 800,
    lineHeight: 'normal',
};
const h6 = {
    fontSize: isMobile ? '1.125rem' : '1.25rem', //18px ou 20px
    fontWeight: 400,
    lineHeight: 'normal',
};
const button = {
    fontSize: isMobile ? '1rem' : '1rem', //16px
    fontWeight: 700,
    letterSpacing: '0.01em',
    lineHeight: 'normal',
};
const subtitle1 = {
    fontSize: isMobile ? '1rem' : '1.125rem', //16px ou 18px
    fontWeight: 700,
    letterSpacing: '0.01em',
    lineHeight: 'normal',
};
const body1 = {
    fontSize: isMobile ? '0.875rem' : '1rem', //14px ou 16px
    fontWeight: 400,
    lineHeight: 'normal',
};
const subtitle2 = {
    fontSize: isMobile ? '0.875rem' : '1rem', //14px ou 16px
    fontWeight: 700,
    letterSpacing: '0.01em',
    lineHeight: 'normal',
};
const body2 = {
    fontSize: isMobile ? '0.75rem' : '0.875rem', //12px ou 14px
    fontWeight: 400,
    lineHeight: 'normal',
};
const caption = {
    fontSize: isMobile ? '0.625rem' : '0.75rem', //10px ou 12px
    fontWeight: 400,
    letterSpacing: '0.02em',
    lineHeight: 'normal',
};





// Sombras
const sombraCard = '0px 2px 4px rgba(0, 0, 0, 0.15)';
const sombraCardOnHover = '0px 2px 9px 3px rgba(0, 0, 0, 0.15)';
const sombraSuperficie = '1px 3px 12px rgba(0, 0, 0, 0.15)';




// Tamanhos
const alturaBarraInstituicao = 42;
const alturaBarraProgresso = 10;




// Outros
const fabContainer = {
  position: 'fixed',
  bottom: isMobile ? 80 : 30,
  right: 30,
};

const containerHome = {
  marginTop: '2em',
};

const formGroup = {
  width: '100%',
  display: 'flex',
  flexDirection: isMobile ? 'column' : 'row',
  justifyContent: 'space-between',
  padding: isMobile ? '0 20px' : 'none',
};

const row = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
};

const form = {
  display: 'flex',
  flexDirection: 'column',
  paddingTop: 20,//isMobile ? 40 : 40,
  marginBottom: 40,
  paddingBottom: 100,
};

const logo = {
  maxWidth: 100,
};

const column = {
  flex: 0.5,
};

const fieldContainer = {
  padding: 4,
  paddingBottom: 0,
};

// Button
const textButtonColor = '#FFF';




export {

  //Paleta
  primaryBlue,
  primaryGreen,
  primaryGradient,
  primaryGradientOnHover,
  secondaryColor,
  secondaryColorOnHover,

  textPrimary,
  textSecondary,
  textDisabled,
  textAuxiliar,
  textWhite,

  supportColor,
  disabledBackground,
  backgroundColor,
  surfaceColor,
  infoBackground,

  dimAtores,
  dimCultura,
  dimEstrutura,
  dimPoliticas,
  dimRecursos,

  dimAtoresSuave,
  dimCulturaSuave,
  dimEstruturaSuave,
  dimPoliticasSuave,
  dimRecursosSuave,

  dimAngularGradient,
  dimGradient,

  errorColor,

  // messages
  warningColor,
  dangerColor,
  successColor,
  infoColor,
  textColorMessages,
  textColorGray,

  // theme
  primaryColor,

  //Backgorund colors
  systemBackgroundColor,
  pageBackgroundColor,

  //Tipografia
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  button,
  subtitle1,
  body1,
  subtitle2,
  body2,
  caption,

  // Sombras
  sombraCard,
  sombraCardOnHover,
  sombraSuperficie,

  // Tamanhos
  alturaBarraInstituicao,
  alturaBarraProgresso,

  //Outros
  fabContainer,
  containerHome,
  row,
  column,
  form,
  logo,
  formGroup,
  fieldContainer,

  // button
  textButtonColor,
};
