import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const CheckoutScreen = () => {
  return (
    <View>
      <Text style={styles.social}>If you want to check out payment Functionality and its details, Please reach Social Garden booth.</Text>
    </View>
  )
}

export default CheckoutScreen

const styles = StyleSheet.create({
  social:{
    alignContent: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
    textAlign: 'center'
  }
})