import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import AnalysisService from '../services/AnalysisService';

export default function HistoryScreen(){
  const [items, setItems] = useState([]);
  useEffect(()=>{ fetchHistory() },[]);
  async function fetchHistory(){
    const res = await AnalysisService.getHistory();
    setItems(res || []);
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mood History</Text>
      <FlatList data={items} keyExtractor={i=>i.id} renderItem={({item})=> (
        <View style={styles.row}><Text>{item.timestamp}</Text><Text>{item.dominant}</Text></View>
      )} />
    </View>
  )
}

const styles = StyleSheet.create({container:{flex:1,padding:16}, title:{fontSize:18, marginBottom:8}, row:{flexDirection:'row',justifyContent:'space-between',padding:8}})
