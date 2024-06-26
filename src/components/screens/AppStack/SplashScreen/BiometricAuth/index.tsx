import {IconButton, Text} from 'react-native-paper';
import {Linking, StyleSheet, ToastAndroid, View} from 'react-native';
import RNBiometrics from 'react-native-simple-biometrics';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {TAppStacknavigationRoutes} from '@app/navigation/navigators/AppStackNavigator';
import EncryptedStorage from 'react-native-encrypted-storage';
import {LOCAL_SAVED_PASSWORDS_KEY} from '@app/constants/keys';
import {useDispatch} from 'react-redux';
import {setPasswordsGlobalStore} from '@app/store/features/passwordsSlice';
import {decryptPasswordFromAESEncryption} from '@app/utils/crypto';

type NavigationProp = NativeStackNavigationProp<TAppStacknavigationRoutes>;

function BiometricAuth() {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();

  async function requestBiometricAuth() {
    const can = await RNBiometrics.canAuthenticate();
    if (!can) {
      Linking.sendIntent('android.settings.BIOMETRIC_ENROLL');
      return;
    }
    try {
      const resp = await RNBiometrics.requestBioAuth(
        'Authenticate',
        'Authentication required to open Password Manager',
      );
      if (resp) {
        const encryptedPasswordsHash = await EncryptedStorage.getItem(
          LOCAL_SAVED_PASSWORDS_KEY,
        );
        if (encryptedPasswordsHash) {
          const decryptedData = decryptPasswordFromAESEncryption(
            encryptedPasswordsHash,
          );
          dispatch(setPasswordsGlobalStore(decryptedData));
        }
        navigation.replace('HomeScreen');
      }
    } catch (e) {
      if (e instanceof Error) {
        ToastAndroid.show(e.message, ToastAndroid.SHORT);
      } else {
        ToastAndroid.show('Something Went Wrong!', ToastAndroid.SHORT);
      }
    }
  }

  return (
    <View style={styles.container}>
      <IconButton
        icon={'fingerprint'}
        size={80}
        onPress={requestBiometricAuth}
      />
      <Text variant="titleMedium" style={styles.text}>
        Click To Authenticate
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
});

export default BiometricAuth;
